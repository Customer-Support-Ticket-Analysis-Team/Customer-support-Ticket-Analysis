import sqlite3
from pathlib import Path
import os
import csv
from datetime import datetime, date

BASE_DIR = Path(__file__).resolve().parent
DATABASE_NAME = Path(
    os.getenv(
        "SQLITE_DB_PATH",
        str(BASE_DIR / "tickets.db")
    )
)

# ---------------------------------------------------------------------------
# Reusable date-range filtering helpers
# ---------------------------------------------------------------------------
DATE_INPUT_FORMAT = "%Y-%m-%d"


def parse_date(value):
    """Parse a YYYY-MM-DD date string into a date object, or None if invalid/empty."""
    if not value:
        return None
    try:
        return datetime.strptime(str(value).strip(), DATE_INPUT_FORMAT).date()
    except (ValueError, TypeError):
        return None


def validate_date_range(from_date, to_date):
    """Validate a (from_date, to_date) pair of date objects.

    Returns (from_date, to_date, error_message). error_message is None when valid.
    Rules:
      - start must not be after end
    """
    if from_date and to_date and from_date > to_date:
        return None, None, "Start date cannot be after end date."
    return from_date, to_date, None


def date_range_params(from_str, to_str):
    """Validate raw query-string date values.

    Returns (from_date, to_date, error_message).
    """
    from_date = parse_date(from_str) if from_str else None
    to_date = parse_date(to_str) if to_str else None
    return validate_date_range(from_date, to_date)


def apply_date_filter(clauses, params, from_date, to_date, column):
    """Append inclusive date-range conditions to a WHERE clause list.

    Start date is inclusive; end date covers the whole day (inclusive).
    Uses SQLite date() so both 'YYYY-MM-DD HH:MM:SS' and ISO-8601 timestamps
    are compared correctly. All values are parameterized.
    """
    if from_date:
        clauses.append(f"date({column}) >= date(?)")
        params.append(from_date.isoformat())
    if to_date:
        clauses.append(f"date({column}) <= date(?)")
        params.append(to_date.isoformat())


def get_connection():
    DATABASE_NAME.parent.mkdir(
        parents=True,
        exist_ok=True
    )
    connection = sqlite3.connect(
        DATABASE_NAME,
        timeout=10
    )
    connection.row_factory = sqlite3.Row
    return connection


def create_table():
    connection = get_connection()

    try:
        connection.execute("""
            CREATE TABLE IF NOT EXISTS tickets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticket_code TEXT UNIQUE,
                reported_by TEXT NOT NULL,
                machine_id TEXT NOT NULL,
                issue_type TEXT NOT NULL,
                priority TEXT DEFAULT 'Medium',
                status TEXT DEFAULT 'Open',
                description TEXT NOT NULL,
                downtime_minutes INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                resolved_at TEXT,
                customer_rating INTEGER
            )
        """)

        # Migration: add missing columns if table already exists
        existing_columns = {
            row["name"]
            for row in connection.execute(
                "PRAGMA table_info(tickets)"
            ).fetchall()
        }

        new_columns = {
            "ticket_code": "TEXT",
            "reported_by": "TEXT NOT NULL DEFAULT 'Unknown'",
            "machine_id": "TEXT NOT NULL DEFAULT ''",
            "issue_type": "TEXT NOT NULL DEFAULT 'Other'",
            "priority": "TEXT DEFAULT 'Medium'",
            "status": "TEXT DEFAULT 'Open'",
            "description": "TEXT NOT NULL DEFAULT ''",
            "downtime_minutes": "INTEGER DEFAULT 0",
            "created_at": "TEXT DEFAULT CURRENT_TIMESTAMP",
            "updated_at": "TEXT DEFAULT CURRENT_TIMESTAMP",
            "resolved_at": "TEXT",
            "customer_rating": "INTEGER",
            "assigned_agent": "TEXT",
        }

        for column, definition in new_columns.items():
            if column not in existing_columns:
                connection.execute(
                    f"ALTER TABLE tickets ADD COLUMN {column} {definition}"
                )

        connection.execute("""
            CREATE INDEX IF NOT EXISTS idx_ticket_status
            ON tickets(status)
        """)

        connection.execute("""
            CREATE INDEX IF NOT EXISTS idx_ticket_priority
            ON tickets(priority)
        """)

        connection.execute("""
            CREATE INDEX IF NOT EXISTS idx_ticket_machine_id
            ON tickets(machine_id)
        """)

        connection.execute("""
            CREATE INDEX IF NOT EXISTS idx_ticket_assigned_agent
            ON tickets(assigned_agent)
        """)

        # --- Historical tickets table (separate from CRUD tickets) ---
        connection.execute("""
            CREATE TABLE IF NOT EXISTS historical_tickets (
                ticket_id TEXT PRIMARY KEY,
                product_purchased TEXT NOT NULL,
                ticket_type TEXT NOT NULL,
                ticket_status TEXT NOT NULL,
                ticket_priority TEXT NOT NULL,
                ticket_channel TEXT NOT NULL,
                first_response_time TEXT,
                time_to_resolution TEXT,
                customer_satisfaction_rating REAL,
                customer_name TEXT,
                assigned_agent TEXT,
                created_at TEXT,
                imported_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Migration: add created_at column to existing historical_tickets tables
        existing_hist_columns = {
            row["name"]
            for row in connection.execute(
                "PRAGMA table_info(historical_tickets)"
            ).fetchall()
        }
        if "created_at" not in existing_hist_columns:
            connection.execute(
                "ALTER TABLE historical_tickets ADD COLUMN created_at TEXT"
            )
            # Backfill created_at for existing records:
            #   - If first_response_time exists, use it (earliest known timestamp)
            #   - Otherwise use imported_at (when the record was loaded)
            connection.execute("""
                UPDATE historical_tickets
                SET created_at = COALESCE(first_response_time, imported_at)
                WHERE created_at IS NULL
            """)

        # Migration: add customer_name column to existing historical_tickets tables
        if "customer_name" not in existing_hist_columns:
            connection.execute(
                "ALTER TABLE historical_tickets ADD COLUMN customer_name TEXT"
            )

        # Migration: add assigned_agent column to existing historical_tickets tables
        if "assigned_agent" not in existing_hist_columns:
            connection.execute(
                "ALTER TABLE historical_tickets ADD COLUMN assigned_agent TEXT"
            )

        # Indexes for historical analytics queries
        connection.execute("""
            CREATE INDEX IF NOT EXISTS idx_hist_ticket_type
            ON historical_tickets(ticket_type)
        """)
        connection.execute("""
            CREATE INDEX IF NOT EXISTS idx_hist_ticket_status
            ON historical_tickets(ticket_status)
        """)
        connection.execute("""
            CREATE INDEX IF NOT EXISTS idx_hist_ticket_priority
            ON historical_tickets(ticket_priority)
        """)
        connection.execute("""
            CREATE INDEX IF NOT EXISTS idx_hist_ticket_channel
            ON historical_tickets(ticket_channel)
        """)
        connection.execute("""
            CREATE INDEX IF NOT EXISTS idx_hist_product
            ON historical_tickets(product_purchased)
        """)
        connection.execute("""
            CREATE INDEX IF NOT EXISTS idx_hist_created_at
            ON historical_tickets(created_at)
        """)

        connection.commit()

    finally:
        connection.close()


def import_historical_csv(csv_path: str) -> dict:
    """
    Import cleaned historical CSV into historical_tickets table.
    Uses INSERT OR IGNORE to prevent duplicates on ticket_id.
    Preserves NULL values for missing timestamps and ratings.
    Does NOT include customer names or email addresses.
    Retains original historical timestamps as ISO-8601 text.
    """
    connection = get_connection()
    imported = 0
    skipped = 0
    errors = []

    try:
        with open(csv_path, newline='', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                ticket_id = (row.get('Ticket ID') or '').strip()
                if not ticket_id:
                    skipped += 1
                    continue

                def _parse_timestamp(raw: str):
                    """Parse a timestamp string to ISO-8601, trying multiple formats."""
                    if not raw or not raw.strip():
                        return None
                    raw = raw.strip()
                    formats = [
                        '%Y-%m-%d %H:%M:%S',   # 2023-06-01 12:15:00
                        '%Y-%m-%d %H:%M',      # 2023-06-01 12:15
                        '%d-%m-%Y %H:%M:%S',   # 01-06-2023 05:42:00
                        '%d-%m-%Y %H:%M',      # 01-06-2023 05:42  (CSV actual format)
                        '%Y-%m-%dT%H:%M:%S',   # ISO-8601
                        '%d/%m/%Y %H:%M:%S',   # 01/06/2023 05:42
                        '%d/%m/%Y %H:%M',      # 01/06/2023 05:42
                    ]
                    for fmt in formats:
                        try:
                            dt = datetime.strptime(raw, fmt)
                            return dt.isoformat()
                        except ValueError:
                            continue
                    return None

                # Parse timestamps
                first_response_raw = (row.get('First Response Time') or '').strip()
                first_response_time = _parse_timestamp(first_response_raw)

                resolution_raw = (row.get('Time to Resolution') or '').strip()
                time_to_resolution = _parse_timestamp(resolution_raw)

                # Created At: read from CSV 'Created At' column if present,
                # otherwise fall back to First Response Time (earliest known
                # timestamp). Open tickets (NULL first_response_time) keep their
                # real Created At from the CSV so they participate in date
                # filtering based on Created At — never dropped just because
                # First Response Time is null.
                created_at_raw = (row.get('Created At') or '').strip()
                created_at = _parse_timestamp(created_at_raw) if created_at_raw else None
                if not created_at:
                    created_at = first_response_time

                rating_raw = (row.get('Customer Satisfaction Rating') or '').strip()
                customer_satisfaction_rating = None
                if rating_raw:
                    try:
                        customer_satisfaction_rating = float(rating_raw)
                    except ValueError:
                        errors.append(f"Invalid satisfaction rating for {ticket_id}: {rating_raw}")

                # Customer name from CSV 'Customer Name' column
                customer_name = (row.get('Customer Name') or '').strip() or None

                try:
                    cursor = connection.execute("""
                        INSERT OR IGNORE INTO historical_tickets (
                            ticket_id, product_purchased, ticket_type, ticket_status,
                            ticket_priority, ticket_channel, first_response_time,
                            time_to_resolution, customer_satisfaction_rating,
                            customer_name, assigned_agent, created_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        ticket_id,
                        row.get('Product Purchased', '').strip(),
                        row.get('Ticket Type', '').strip(),
                        row.get('Ticket Status', '').strip(),
                        row.get('Ticket Priority', '').strip(),
                        row.get('Ticket Channel', '').strip(),
                        first_response_time,
                        time_to_resolution,
                        customer_satisfaction_rating,
                        customer_name,
                        (row.get('Assigned Agent') or '').strip() or None,
                        created_at,
                    ))
                    if cursor.rowcount > 0:
                        imported += 1
                    else:
                        skipped += 1  # Duplicate ticket_id, ignored
                except sqlite3.IntegrityError as e:
                    skipped += 1
                    errors.append(f"Integrity error for {ticket_id}: {e}")

        connection.commit()

    except FileNotFoundError:
        errors.append(f"CSV file not found: {csv_path}")
    finally:
        connection.close()

    return {
        "imported": imported,
        "skipped": skipped,
        "errors": errors,
        "total_in_table": get_historical_count(),
    }


def get_historical_count() -> int:
    """Return the number of records in historical_tickets."""
    connection = get_connection()
    try:
        row = connection.execute(
            "SELECT COUNT(*) as cnt FROM historical_tickets"
        ).fetchone()
        return row["cnt"] if row else 0
    finally:
        connection.close()
