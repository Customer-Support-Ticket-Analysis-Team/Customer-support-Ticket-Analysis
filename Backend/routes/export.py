from flask import Blueprint, make_response
from database import get_connection
import csv
import io

export_bp = Blueprint("export", __name__,url_prefix="/api/export")

@export_bp.route("/tickets", methods=["GET"])
def export_tickets_csv():
    connection = get_connection()
    try:
        rows = connection.execute("SELECT * FROM tickets ORDER BY created_at DESC").fetchall()
        tickets = [dict(row) for row in rows]
    finally:
        connection.close()

    output = io.StringIO()
    if tickets:
        fieldnames = list(tickets[0].keys())
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(tickets)

    response = make_response(output.getvalue())
    response.headers["Content-Disposition"] = "attachment; filename=tickets_export.csv"
    response.headers["Content-Type"] = "text/csv"
    return response