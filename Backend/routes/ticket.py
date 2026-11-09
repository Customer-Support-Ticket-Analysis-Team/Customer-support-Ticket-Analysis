from flask import Blueprint, request, jsonify
from database import get_connection, date_range_params, apply_date_filter
from datetime import datetime

tickets_bp = Blueprint("tickets", __name__, url_prefix="/api/tickets")

ALLOWED_STATUSES = ["Open", "In Progress", "Resolved"]
ALLOWED_PRIORITIES = ["Low", "Medium", "High", "Critical"]
ALLOWED_ISSUE_TYPES = ["Machine Failure", "Sensor Alert", "Connectivity", "Maintenance", "Other"]
_ticket_counter = 0

def _get_next_ticket_code():
    global _ticket_counter
    connection = get_connection()
    try:
        row = connection.execute(
            "SELECT ticket_code FROM tickets WHERE ticket_code IS NOT NULL ORDER BY id DESC LIMIT 1"
        ).fetchone()
        if row and row["ticket_code"]:
            try:
                _ticket_counter = int(row["ticket_code"].split("-")[-1])
            except (ValueError, IndexError):
                _ticket_counter = 0
    finally:
        connection.close()
    _ticket_counter += 1
    return f"TKT-{_ticket_counter:04d}"


@tickets_bp.route("/", methods=["GET"])
def get_tickets():
    search = request.args.get("search", "").strip()
    status = request.args.get("status", "").strip()
    priority = request.args.get("priority", "").strip()
    customer = request.args.get("customer", "").strip()
    from_str = request.args.get("from", "").strip()
    to_str = request.args.get("to", "").strip()
    limit_str = request.args.get("limit", "").strip()

    from_date, to_date, error = date_range_params(from_str, to_str)
    if error:
        return jsonify({"success": False, "error": error}), 400

    # ── Build CRUD tickets conditions ──
    crud_conditions = []
    crud_values = []

    if search:
        crud_conditions.append("(ticket_code LIKE ? OR machine_id LIKE ? OR reported_by LIKE ?)")
        search_pattern = f"%{search}%"
        crud_values.extend([search_pattern, search_pattern, search_pattern])

    if customer:
        crud_conditions.append("reported_by LIKE ?")
        crud_values.append(f"%{customer}%")

    if status:
        if status not in ALLOWED_STATUSES:
            return jsonify({"success": False, "error": f"Invalid status: {status}"}), 400
        crud_conditions.append("status = ?")
        crud_values.append(status)

    if priority:
        if priority not in ALLOWED_PRIORITIES:
            return jsonify({"success": False, "error": f"Invalid priority: {priority}"}), 400
        crud_conditions.append("priority = ?")
        crud_values.append(priority)

    apply_date_filter(crud_conditions, crud_values, from_date, to_date, "created_at")

    # ── Build historical tickets conditions ──
    hist_conditions = []
    hist_values = []

    if search:
        hist_conditions.append("(ticket_id LIKE ? OR product_purchased LIKE ? OR ticket_type LIKE ? OR customer_name LIKE ?)")
        hist_values.extend([search_pattern, search_pattern, search_pattern, search_pattern])

    if customer:
        hist_conditions.append("customer_name LIKE ?")
        hist_values.append(f"%{customer}%")

    if status:
        # Map CRUD status to historical ticket_status values
        status_map = {
            "Open": "ticket_status = 'Open'",
            "In Progress": "ticket_status IN ('Pending Customer Response', 'Pending')",
            "Resolved": "ticket_status = 'Closed'",
        }
        if status in status_map:
            hist_conditions.append(status_map[status])

    if priority:
        hist_conditions.append("ticket_priority = ?")
        hist_values.append(priority)

    apply_date_filter(hist_conditions, hist_values, from_date, to_date, "created_at")

    # ── CRUD subquery ──
    crud_sql = """
        SELECT
            ticket_code as id,
            ticket_code,
            reported_by,
            machine_id,
            issue_type,
            priority,
            status,
            created_at,
            assigned_agent,
            resolved_at,
            'CRUD' as source
        FROM tickets
    """
    if crud_conditions:
        crud_sql += " WHERE " + " AND ".join(crud_conditions)

    # ── Historical subquery ──
    hist_sql = """
        SELECT
            ticket_id as id,
            ticket_id as ticket_code,
            customer_name as reported_by,
            product_purchased as machine_id,
            ticket_type as issue_type,
            ticket_priority as priority,
            ticket_status as status,
            created_at,
            assigned_agent,
            time_to_resolution as resolved_at,
            'Historical' as source
        FROM historical_tickets
    """
    if hist_conditions:
        hist_sql += " WHERE " + " AND ".join(hist_conditions)

    # ── UNION both populations ──
    query = f"""
        {crud_sql}
        UNION ALL
        {hist_sql}
        ORDER BY created_at DESC
    """

    all_values = crud_values + hist_values

    if limit_str:
        try:
            limit_int = int(limit_str)
            if limit_int > 0:
                query += f" LIMIT {limit_int}"
        except ValueError:
            pass  # ignore an invalid limit value

    connection = get_connection()
    try:
        rows = connection.execute(query, all_values).fetchall()
        tickets = [dict(row) for row in rows]
        return jsonify({"success": True, "tickets": tickets})
    finally:
        connection.close()


@tickets_bp.route("/<int:ticket_id>", methods=["GET"])
def get_ticket(ticket_id):
    connection = get_connection()
    try:
        row = connection.execute(
            "SELECT * FROM tickets WHERE id = ?", (ticket_id,)
        ).fetchone()
        if not row:
            return jsonify({"success": False, "error": "Ticket not found"}), 404
        return jsonify({"success": True, "ticket": dict(row)})
    finally:
        connection.close()


@tickets_bp.route("/", methods=["POST"])
def create_ticket():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"success": False, "error": "Valid JSON required"}), 400

    reported_by = data.get("reported_by", "").strip()
    machine_id = data.get("machine_id", "").strip()
    issue_type = data.get("issue_type", "").strip()
    priority = data.get("priority", "Medium").strip()
    description = data.get("description", "").strip()
    downtime_minutes = data.get("downtime_minutes", 0)

    # Validation
    if not reported_by:
        return jsonify({"success": False, "error": "reported_by is required"}), 400
    if not machine_id:
        return jsonify({"success": False, "error": "machine_id is required"}), 400
    if not issue_type:
        return jsonify({"success": False, "error": "issue_type is required"}), 400
    if issue_type not in ALLOWED_ISSUE_TYPES:
        return jsonify({"success": False, "error": f"Invalid issue_type: {issue_type}"}), 400
    if priority not in ALLOWED_PRIORITIES:
        return jsonify({"success": False, "error": f"Invalid priority: {priority}"}), 400
    if not description:
        return jsonify({"success": False, "error": "description is required"}), 400

    try:
        downtime_minutes = int(downtime_minutes)
        if downtime_minutes < 0:
            raise ValueError
    except (ValueError, TypeError):
        return jsonify({"success": False, "error": "downtime_minutes must be a non-negative integer"}), 400

    ticket_code = _get_next_ticket_code()
    now = datetime.utcnow().isoformat()

    connection = get_connection()
    try:
        cursor = connection.execute("""
            INSERT INTO tickets (
                ticket_code, reported_by, machine_id, issue_type,
                priority, description, downtime_minutes,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            ticket_code, reported_by, machine_id, issue_type,
            priority, description, downtime_minutes,
            now, now
        ))
        connection.commit()
        new_id = cursor.lastrowid

        row = connection.execute("SELECT * FROM tickets WHERE id = ?", (new_id,)).fetchone()
        return jsonify({
            "success": True,
            "ticket": dict(row),
            "message": "Ticket created successfully"
        }), 201
    finally:
        connection.close()


@tickets_bp.route("/<int:ticket_id>/status", methods=["PATCH"])
def update_ticket_status(ticket_id):
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"success": False, "error": "Valid JSON required"}), 400

    status = data.get("status")
    if status not in ALLOWED_STATUSES:
        return jsonify({
            "success": False,
            "error": f"Invalid status. Allowed: {ALLOWED_STATUSES}"
        }), 400

    connection = get_connection()
    try:
        # Check ticket exists
        existing = connection.execute(
            "SELECT id FROM tickets WHERE id = ?", (ticket_id,)
        ).fetchone()
        if not existing:
            return jsonify({"success": False, "error": "Ticket not found"}), 404

        now = datetime.utcnow().isoformat()
        resolved_at = now if status == "Resolved" else None

        connection.execute("""
            UPDATE tickets
            SET status = ?, updated_at = ?, resolved_at = ?
            WHERE id = ?
        """, (status, now, resolved_at, ticket_id))
        connection.commit()

        row = connection.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,)).fetchone()
        return jsonify({
            "success": True,
            "ticket": dict(row),
            "message": f"Ticket status updated to {status}"
        })
    finally:
        connection.close()


@tickets_bp.route("/<int:ticket_id>/assign-agent", methods=["PATCH"])
def assign_agent(ticket_id):
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"success": False, "error": "Valid JSON required"}), 400

    agent = data.get("assigned_agent", "").strip() or None

    connection = get_connection()
    try:
        existing = connection.execute(
            "SELECT id FROM tickets WHERE id = ?", (ticket_id,)
        ).fetchone()
        if not existing:
            return jsonify({"success": False, "error": "Ticket not found"}), 404

        now = datetime.utcnow().isoformat()
        connection.execute("""
            UPDATE tickets
            SET assigned_agent = ?, updated_at = ?
            WHERE id = ?
        """, (agent, now, ticket_id))
        connection.commit()

        row = connection.execute("SELECT * FROM tickets WHERE id = ?", (ticket_id,)).fetchone()
        return jsonify({
            "success": True,
            "ticket": dict(row),
            "message": f"Agent {'assigned' if agent else 'unassigned'} successfully"
        })
    finally:
        connection.close()
