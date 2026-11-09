from flask import Blueprint, request, jsonify
from database import get_connection, import_historical_csv, get_historical_count
import os
from pathlib import Path

historical_bp = Blueprint("historical", __name__, url_prefix="/api/historical")

# Default path to the cleaned CSV
DEFAULT_CSV_PATH = str(
    Path(__file__).resolve().parent.parent / "Data-analysis" / "customer_support_tickets_cleaned.csv"
)


@historical_bp.route("/import", methods=["POST"])
def import_historical():
    """Import the cleaned historical CSV into historical_tickets (dedup by ticket_id)."""
    data = request.get_json(silent=True) or {}
    csv_path = data.get("csv_path", DEFAULT_CSV_PATH)

    if not os.path.exists(csv_path):
        return jsonify({"success": False, "error": f"CSV file not found: {csv_path}"}), 404

    result = import_historical_csv(csv_path)
    return jsonify({
        "success": True,
        "imported": result["imported"],
        "skipped": result["skipped"],
        "errors": result["errors"],
        "total_in_table": result["total_in_table"],
    })


@historical_bp.route("/status", methods=["GET"])
def historical_status():
    """Return count of historical tickets and import status."""
    return jsonify({
        "success": True,
        "total_historical_tickets": get_historical_count(),
        "table": "historical_tickets",
    })
