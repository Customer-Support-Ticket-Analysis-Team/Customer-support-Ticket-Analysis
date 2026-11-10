from flask import Blueprint, jsonify, request
from database import get_connection, date_range_params, apply_date_filter

dashboard_bp = Blueprint("dashboard", _name_, url_prefix="/api/dashboard")


def _count(connection, table, conditions, params, date_column=None,
           from_date=None, to_date=None, apply_date=True):
    """Count rows in table satisfying conditions.

    If apply_date is True and a date range is provided, appends an inclusive
    date filter on date_column (start inclusive, end covers the whole day).
    All values are parameterized.
    """
    clauses = list(conditions)
    p = list(params)
    if apply_date and date_column and (from_date or to_date):
        apply_date_filter(clauses, p, from_date, to_date, date_column)
    sql = f"…
https://github.com/Customer-Support-Ticket-Analysis-Team/Customer-support-Ticket-Analysis is url pe jaake ek nayi branch bnake hi code add karna main branch me mat karna pehle branch select ho jaaye tab
view all branch pe jaake nayi branch bnaoo apne naam se then back aake dobara select karo jab main ki jagah tumhari wali branch aaye tab edit karnafrom flask import Blueprint, jsonify, request
from database import get_connection, date_range_params, apply_date_filter

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


def _count(connection, table, conditions, params, date_column=None,
           from_date=None, to_date=None, apply_date=True):
    """Count rows in `table` satisfying `conditions`.

    If `apply_date` is True and a date range is provided, appends an inclusive
    date filter on `date_column` (start inclusive, end covers the whole day).
    All values are parameterized.
    """
    clauses = list(conditions)
    p = list(params)
    if apply_date and date_column and (from_date or to_date):
        apply_date_filter(clauses, p, from_date, to_date, date_column)
    sql = f"SELECT COUNT(*) FROM {table}"
    if clauses:
        sql += " WHERE " + " AND ".join(clauses)
    return connection.execute(sql, p).fetchone()[0]


# Status definitions based on timestamps (historical_tickets):
#   Open     = first_response_time IS NULL AND time_to_resolution IS NULL
#   Pending  = first_response_time IS NOT NULL AND time_to_resolution IS NULL
#   Closed   = time_to_resolution IS NOT NULL
HIST_OPEN_COND = "first_response_time IS NULL AND time_to_resolution IS NULL"
HIST_PENDING_COND = "first_response_time IS NOT NULL AND time_to_resolution IS NULL"
HIST_CLOSED_COND = "time_to_resolution IS NOT NULL"


@dashboard_bp.route("/summary", methods=["GET"])
def dashboard_summary():
    from_str = request.args.get("from", "").strip()
    to_str = request.args.get("to", "").strip()

    from_date, to_date, error = date_range_params(from_str, to_str)
    if error:
        return jsonify({"success": False, "error": error}), 400

    connection = get_connection()
    try:
        # ═══════════════════════════════════════════════════════════════════
        # KPI CARD LOGIC — all filtering uses Created At
        # Two populations are combined for the primary KPI cards:
        #   • CRUD `tickets` table      → statuses: Open / In Progress / Resolved
        #   • Historical `historical_tickets` → status derived from timestamps
        # ═══════════════════════════════════════════════════════════════════

        # ── 1. Open Tickets (date-filtered by created_at) ──────────────────
        hist_open = _count(
            connection, "historical_tickets",
            [HIST_OPEN_COND], [],
            "created_at", from_date, to_date, apply_date=True
        )
        crud_open = _count(
            connection, "tickets",
            ["status = 'Open'"], [],
            "created_at", from_date, to_date, apply_date=True
        )
        open_tickets = hist_open + crud_open

        # ── 2. Pending = In Progress (date-filtered by created_at) ─────────
        hist_pending = _count(
            connection, "historical_tickets",
            [HIST_PENDING_COND], [],
            "created_at", from_date, to_date, apply_date=True
        )
        crud_pending = _count(
            connection, "tickets",
            ["status = 'In Progress'"], [],
            "created_at", from_date, to_date, apply_date=True
        )
        in_progress_tickets = hist_pending + crud_pending

        # ── 3. Resolved = Closed (date-filtered by created_at) ─────────────
        hist_closed = _count(
            connection, "historical_tickets",
            [HIST_CLOSED_COND], [],
            "created_at", from_date, to_date, apply_date=True
        )
        crud_resolved = _count(
            connection, "tickets",
            ["status = 'Resolved'"], [],
            "created_at", from_date, to_date, apply_date=True
        )
        resolved_tickets = hist_closed + crud_resolved

        # ── 4. Total Tickets = Open + Pending + Resolved ───────────────────
        total_tickets = open_tickets + in_progress_tickets + resolved_tickets

        # ── 5. Resolution Rate ─────────────────────────────────────────────
        resolution_rate = round((resolved_tickets / total_tickets) * 100, 1) if total_tickets else 0.0

        # ── 6. Historical Records (historical table only, created_at range) ─
        historical_total = _count(
            connection, "historical_tickets",
            [], [],
            "created_at", from_date, to_date, apply_date=True
        )

        # Historical breakdown by timestamp-derived status (for reference)
        hist_open_all = _count(
            connection, "historical_tickets", [HIST_OPEN_COND], [],
            "created_at", from_date, to_date, apply_date=True
        )
        hist_pending_all = _count(
            connection, "historical_tickets", [HIST_PENDING_COND], [],
            "created_at", from_date, to_date, apply_date=True
        )
        hist_closed_all = _count(
            connection, "historical_tickets", [HIST_CLOSED_COND], [],
            "created_at", from_date, to_date, apply_date=True
        )

        # Historical satisfaction stats (excluding NULL ratings)
        hist_sat_clauses = ["customer_satisfaction_rating IS NOT NULL"]
        hist_sat_params = []
        apply_date_filter(hist_sat_clauses, hist_sat_params, from_date, to_date, "created_at")
        hist_sat_sql = ("SELECT AVG(customer_satisfaction_rating) as avg_rating, "
                        "COUNT(customer_satisfaction_rating) as rating_count "
                        "FROM historical_tickets")
        if hist_sat_clauses:
            hist_sat_sql += " WHERE " + " AND ".join(hist_sat_clauses)
        hist_sat_avg = connection.execute(hist_sat_sql, hist_sat_params).fetchone()

        return jsonify({
            # ── Primary KPI cards (blended CRUD + Historical) ─────────────
            "total_tickets": total_tickets,
            "open_tickets": open_tickets,
            "in_progress_tickets": in_progress_tickets,
            "resolved_tickets": resolved_tickets,
            "resolution_rate": resolution_rate,

            # ── Historical insights (source-specific, clearly labelled) ───
            "historical_total": historical_total,
            "historical_open": hist_open_all,
            "historical_pending": hist_pending_all,
            "historical_closed": hist_closed_all,
            "historical_satisfaction_avg": round(hist_sat_avg["avg_rating"], 2) if hist_sat_avg["avg_rating"] else None,
            "historical_satisfaction_count": hist_sat_avg["rating_count"],
        })
    finally:
        connection.close()
