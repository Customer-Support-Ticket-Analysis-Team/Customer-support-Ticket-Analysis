from flask import Blueprint, jsonify, request
from database import get_connection, date_range_params, apply_date_filter

analytics_bp = Blueprint("analytics", __name__, url_prefix="/api/analytics")


def _nullsafe(val):
    """Return None for empty/missing values, else the value."""
    return val if val not in (None, "", "null") else None


# ── CHART 1: Ticket Type vs Ticket Status (percentage heatmap) ──────────────
@analytics_bp.route("/historical/ticket-status", methods=["GET"])
def historical_ticket_status():
    connection = get_connection()
    try:
        from_str = request.args.get("from", "").strip()
        to_str = request.args.get("to", "").strip()
        from_date, to_date, error = date_range_params(from_str, to_str)
        if error:
            return jsonify({"success": False, "error": error}), 400

        clauses = []
        params = []
        apply_date_filter(clauses, params, from_date, to_date, "created_at")
        where_sql = " WHERE " + " AND ".join(clauses) if clauses else ""

        # UNION historical_tickets with CRUD tickets so newly created tickets
        # appear immediately in the status distribution chart.
        # CRUD status mapping: Open→Open, In Progress→Pending, Resolved→Closed
        rows = connection.execute(f"""
            SELECT ticket_type, ticket_status, COUNT(*) as cnt
            FROM (
                SELECT ticket_type, ticket_status, created_at
                FROM historical_tickets
                UNION ALL
                SELECT issue_type as ticket_type,
                       CASE status
                           WHEN 'Open' THEN 'Open'
                           WHEN 'In Progress' THEN 'Pending'
                           WHEN 'Resolved' THEN 'Closed'
                           ELSE status
                       END as ticket_status,
                       created_at
                FROM tickets
            )
            {where_sql}
            GROUP BY ticket_type, ticket_status
        """, params).fetchall()

        # Build nested structure: {ticket_type: {status: count}}
        data = {}
        types = set()
        statuses = set()
        for row in rows:
            t = row["ticket_type"]
            s = row["ticket_status"]
            c = row["cnt"]
            types.add(t)
            statuses.add(s)
            data.setdefault(t, {})[s] = c

        # Calculate percentages per ticket_type (row-wise)
        result = {
            "types": sorted(types),
            "statuses": sorted(statuses),
            "cells": [],
            "totals": {},
        }
        for t in sorted(types):
            type_total = sum(data.get(t, {}).values())
            result["totals"][t] = type_total
            for s in sorted(statuses):
                cnt = data.get(t, {}).get(s, 0)
                pct = round((cnt / type_total) * 100, 1) if type_total else 0.0
                result["cells"].append({
                    "ticket_type": t,
                    "ticket_status": s,
                    "count": cnt,
                    "percentage": pct,
                })

        return jsonify({"success": True, "data": result})
    finally:
        connection.close()


# ── CHART 2: Ticket Type vs Ticket Priority (percentage heatmap) ────────────
@analytics_bp.route("/historical/priority", methods=["GET"])
def historical_priority():
    connection = get_connection()
    try:
        from_str = request.args.get("from", "").strip()
        to_str = request.args.get("to", "").strip()
        from_date, to_date, error = date_range_params(from_str, to_str)
        if error:
            return jsonify({"success": False, "error": error}), 400

        clauses = []
        params = []
        apply_date_filter(clauses, params, from_date, to_date, "created_at")
        where_sql = " WHERE " + " AND ".join(clauses) if clauses else ""

        rows = connection.execute(f"""
            SELECT
                ticket_type,
                ticket_priority,
                COUNT(*) as cnt
            FROM historical_tickets
            {where_sql}
            GROUP BY ticket_type, ticket_priority
        """, params).fetchall()

        data = {}
        types = set()
        priorities = set()
        for row in rows:
            t = row["ticket_type"]
            p = row["ticket_priority"]
            c = row["cnt"]
            types.add(t)
            priorities.add(p)
            data.setdefault(t, {})[p] = c

        priority_order = ["Critical", "High", "Medium", "Low"]
        result = {
            "types": sorted(types),
            "priorities": [p for p in priority_order if p in priorities],
            "cells": [],
            "totals": {},
        }
        for t in sorted(types):
            type_total = sum(data.get(t, {}).values())
            result["totals"][t] = type_total
            for p in result["priorities"]:
                cnt = data.get(t, {}).get(p, 0)
                pct = round((cnt / type_total) * 100, 1) if type_total else 0.0
                result["cells"].append({
                    "ticket_type": t,
                    "ticket_priority": p,
                    "count": cnt,
                    "percentage": pct,
                })

        return jsonify({"success": True, "data": result})
    finally:
        connection.close()


# ── CHART 3: Product Purchased vs Ticket Type (top 10 products heatmap) ─────
@analytics_bp.route("/historical/product-types", methods=["GET"])
def historical_product_types():
    connection = get_connection()
    try:
        from_str = request.args.get("from", "").strip()
        to_str = request.args.get("to", "").strip()
        from_date, to_date, error = date_range_params(from_str, to_str)
        if error:
            return jsonify({"success": False, "error": error}), 400

        clauses = []
        params = []
        apply_date_filter(clauses, params, from_date, to_date, "created_at")
        where_sql = " WHERE " + " AND ".join(clauses) if clauses else ""

        top_products = connection.execute(f"""
            SELECT product_purchased
            FROM historical_tickets
            {where_sql}
            GROUP BY product_purchased
            ORDER BY COUNT(*) DESC
            LIMIT 10
        """, params).fetchall()
        product_list = [row["product_purchased"] for row in top_products]

        if not product_list:
            return jsonify({
                "success": True,
                "data": {
                    "products": [],
                    "types": [],
                    "cells": [],
                }
            })

        placeholders = ",".join("?" for _ in product_list)
        product_params = list(params) + product_list
        product_where = where_sql
        if product_where:
            product_where += " AND "
        product_where += f"product_purchased IN ({placeholders})"

        rows = connection.execute(f"""
            SELECT
                product_purchased,
                ticket_type,
                COUNT(*) as cnt
            FROM historical_tickets
            WHERE {product_where}
            GROUP BY product_purchased, ticket_type
        """, product_params).fetchall()

        types = set()
        data = {}
        for row in rows:
            p = row["product_purchased"]
            t = row["ticket_type"]
            c = row["cnt"]
            types.add(t)
            data.setdefault(p, {})[t] = c

        result = {
            "products": product_list,
            "types": sorted(types),
            "cells": [],
            "totals": {},
        }
        for p in product_list:
            prod_total = sum(data.get(p, {}).values())
            result["totals"][p] = prod_total
            for t in sorted(types):
                cnt = data.get(p, {}).get(t, 0)
                pct = round((cnt / prod_total) * 100, 1) if prod_total else 0.0
                result["cells"].append({
                    "product": p,
                    "ticket_type": t,
                    "count": cnt,
                    "percentage": pct,
                })

        return jsonify({"success": True, "data": result})
    finally:
        connection.close()


# ── CHART 4: Customer Satisfaction by Ticket Type (box plot) ────────────────
@analytics_bp.route("/historical/satisfaction-by-type", methods=["GET"])
def historical_satisfaction_by_type():
    connection = get_connection()
    try:
        from_str = request.args.get("from", "").strip()
        to_str = request.args.get("to", "").strip()
        from_date, to_date, error = date_range_params(from_str, to_str)
        if error:
            return jsonify({"success": False, "error": error}), 400

        clauses = ["customer_satisfaction_rating IS NOT NULL"]
        params = []
        apply_date_filter(clauses, params, from_date, to_date, "created_at")
        where_sql = " WHERE " + " AND ".join(clauses) if clauses else ""

        rows = connection.execute(f"""
            SELECT
                ticket_type,
                customer_satisfaction_rating
            FROM historical_tickets
            {where_sql}
            ORDER BY ticket_type
        """, params).fetchall()

        # Group ratings by ticket_type
        grouped = {}
        for row in rows:
            t = row["ticket_type"]
            r = row["customer_satisfaction_rating"]
            grouped.setdefault(t, []).append(r)

        def _box_stats(values):
            if not values:
                return None
            sorted_vals = sorted(values)
            n = len(sorted_vals)
            mean = round(sum(sorted_vals) / n, 2)
            median = sorted_vals[n // 2] if n % 2 == 1 else round(
                (sorted_vals[n // 2 - 1] + sorted_vals[n // 2]) / 2, 2
            )
            q1 = sorted_vals[n // 4] if n >= 4 else sorted_vals[0]
            q3 = sorted_vals[3 * n // 4] if n >= 4 else sorted_vals[-1]
            return {
                "count": n,
                "mean": mean,
                "median": median,
                "min": sorted_vals[0],
                "max": sorted_vals[-1],
                "q1": q1,
                "q3": q3,
                "values": sorted_vals,  # for raw box plot rendering
            }

        result = {
            "types": sorted(grouped.keys()),
            "series": {},
        }
        for t in sorted(grouped.keys()):
            result["series"][t] = _box_stats(grouped[t])

        return jsonify({"success": True, "data": result})
    finally:
        connection.close()


# ── CHART 5: Customer Satisfaction by Ticket Channel (box plot) ─────────────
@analytics_bp.route("/historical/satisfaction-by-channel", methods=["GET"])
def historical_satisfaction_by_channel():
    connection = get_connection()
    try:
        from_str = request.args.get("from", "").strip()
        to_str = request.args.get("to", "").strip()
        from_date, to_date, error = date_range_params(from_str, to_str)
        if error:
            return jsonify({"success": False, "error": error}), 400

        clauses = ["customer_satisfaction_rating IS NOT NULL"]
        params = []
        apply_date_filter(clauses, params, from_date, to_date, "created_at")
        where_sql = " WHERE " + " AND ".join(clauses) if clauses else ""

        rows = connection.execute(f"""
            SELECT
                ticket_channel,
                customer_satisfaction_rating
            FROM historical_tickets
            {where_sql}
            ORDER BY ticket_channel
        """, params).fetchall()

        grouped = {}
        for row in rows:
            c = row["ticket_channel"]
            r = row["customer_satisfaction_rating"]
            grouped.setdefault(c, []).append(r)

        def _box_stats(values):
            if not values:
                return None
            sorted_vals = sorted(values)
            n = len(sorted_vals)
            mean = round(sum(sorted_vals) / n, 2)
            median = sorted_vals[n // 2] if n % 2 == 1 else round(
                (sorted_vals[n // 2 - 1] + sorted_vals[n // 2]) / 2, 2
            )
            q1 = sorted_vals[n // 4] if n >= 4 else sorted_vals[0]
            q3 = sorted_vals[3 * n // 4] if n >= 4 else sorted_vals[-1]
            return {
                "count": n,
                "mean": mean,
                "median": median,
                "min": sorted_vals[0],
                "max": sorted_vals[-1],
                "q1": q1,
                "q3": q3,
                "values": sorted_vals,
            }

        channel_order = ["Email", "Chat", "Phone", "Social media"]
        result = {
            "channels": [c for c in channel_order if c in grouped],
            "series": {},
        }
        for c in result["channels"]:
            result["series"][c] = _box_stats(grouped[c])

        return jsonify({"success": True, "data": result})
    finally:
        connection.close()


# ── CHART 6: First Response Time Analysis ───────────────────────────────────
@analytics_bp.route("/historical/first-response", methods=["GET"])
def historical_first_response():
    connection = get_connection()
    try:
        from_str = request.args.get("from", "").strip()
        to_str = request.args.get("to", "").strip()
        from_date, to_date, error = date_range_params(from_str, to_str)
        if error:
            return jsonify({"success": False, "error": error}), 400

        clauses = []
        params = []
        apply_date_filter(clauses, params, from_date, to_date, "created_at")
        where_sql = " WHERE " + " AND ".join(clauses) if clauses else ""

        # Base counts (date-filtered by created_at)
        total = connection.execute(
            f"SELECT COUNT(*) as cnt FROM historical_tickets {where_sql}",
            params,
        ).fetchone()["cnt"]

        not_null_clauses = list(clauses) + ["first_response_time IS NOT NULL"]
        not_null_params = list(params)
        not_null_where = " WHERE " + " AND ".join(not_null_clauses) if not_null_clauses else ""

        available = connection.execute(
            f"SELECT COUNT(*) as cnt FROM historical_tickets {not_null_where}",
            not_null_params,
        ).fetchone()["cnt"]
        missing = total - available
        coverage = round((available / total) * 100, 1) if total else 0.0

        # Min / max timestamps (of first_response_time)
        ts_row = connection.execute(f"""
            SELECT
                MIN(first_response_time) as min_ts,
                MAX(first_response_time) as max_ts
            FROM historical_tickets
            {not_null_where}
        """, not_null_params).fetchone()

        # Breakdown by Ticket Type (filtered by created_at)
        type_rows = connection.execute(f"""
            SELECT
                ticket_type,
                COUNT(*) as total,
                SUM(CASE WHEN first_response_time IS NOT NULL THEN 1 ELSE 0 END) as available
            FROM historical_tickets
            {where_sql}
            GROUP BY ticket_type
            ORDER BY total DESC
        """, params).fetchall()

        # Breakdown by Ticket Channel (filtered by created_at)
        channel_rows = connection.execute(f"""
            SELECT
                ticket_channel,
                COUNT(*) as total,
                SUM(CASE WHEN first_response_time IS NOT NULL THEN 1 ELSE 0 END) as available
            FROM historical_tickets
            {where_sql}
            GROUP BY ticket_channel
            ORDER BY total DESC
        """, params).fetchall()

        # Hour-of-day distribution (of first_response_time, filtered by created_at)
        hour_rows = connection.execute(f"""
            SELECT
                CAST(strftime('%H', first_response_time) AS INTEGER) as hour,
                COUNT(*) as cnt
            FROM historical_tickets
            {not_null_where}
            GROUP BY hour
            ORDER BY hour
        """, not_null_params).fetchall()

        # Consistency check: first response before resolution for Closed tickets
        consistency = connection.execute(f"""
            SELECT
                SUM(CASE
                    WHEN ticket_status = 'Closed'
                     AND first_response_time IS NOT NULL
                     AND time_to_resolution IS NOT NULL
                     AND first_response_time > time_to_resolution
                    THEN 1 ELSE 0 END) as inconsistent_count
            FROM historical_tickets
            {where_sql}
        """, params).fetchone()["inconsistent_count"]

        return jsonify({
            "success": True,
            "data": {
                "total_tickets": total,
                "available_timestamps": available,
                "missing_timestamps": missing,
                "coverage_percentage": coverage,
                "min_timestamp": ts_row["min_ts"],
                "max_timestamp": ts_row["max_ts"],
                "by_ticket_type": [
                    {
                        "ticket_type": r["ticket_type"],
                        "total": r["total"],
                        "available": r["available"],
                        "missing": r["total"] - r["available"],
                        "coverage": round((r["available"] / r["total"]) * 100, 1) if r["total"] else 0.0,
                    }
                    for r in type_rows
                ],
                "by_ticket_channel": [
                    {
                        "ticket_channel": r["ticket_channel"],
                        "total": r["total"],
                        "available": r["available"],
                        "missing": r["total"] - r["available"],
                        "coverage": round((r["available"] / r["total"]) * 100, 1) if r["total"] else 0.0,
                    }
                    for r in channel_rows
                ],
                "hour_of_day": [
                    {"hour": r["hour"], "count": r["cnt"]}
                    for r in hour_rows
                ],
                "consistency_issues": consistency,
                "data_quality_note": (
                    f"Found {consistency} records where the first-response timestamp is after the resolution timestamp. "
                    "Timestamps are recorded as-is from the source dataset. "
                    "No elapsed-duration or SLA metrics are calculated because "
                    "a verified ticket creation timestamp is unavailable."
                ) if (consistency and consistency > 0) else None,
            }
        })
    finally:
        connection.close()


# ── CHART 7: Time to Resolution Analysis ────────────────────────────────────
@analytics_bp.route("/historical/resolution", methods=["GET"])
def historical_resolution():
    connection = get_connection()
    try:
        from_str = request.args.get("from", "").strip()
        to_str = request.args.get("to", "").strip()
        from_date, to_date, error = date_range_params(from_str, to_str)
        if error:
            return jsonify({"success": False, "error": error}), 400

        clauses = []
        params = []
        apply_date_filter(clauses, params, from_date, to_date, "created_at")
        where_sql = " WHERE " + " AND ".join(clauses) if clauses else ""

        total = connection.execute(
            f"SELECT COUNT(*) as cnt FROM historical_tickets {where_sql}",
            params,
        ).fetchone()["cnt"]

        res_not_null_clauses = list(clauses) + ["time_to_resolution IS NOT NULL"]
        res_not_null_params = list(params)
        res_not_null_where = (
            " WHERE " + " AND ".join(res_not_null_clauses) if res_not_null_clauses else ""
        )

        available = connection.execute(
            f"SELECT COUNT(*) as cnt FROM historical_tickets {res_not_null_where}",
            res_not_null_params,
        ).fetchone()["cnt"]
        missing = total - available

        # Resolution timestamp coverage among Closed tickets (filtered by created_at)
        closed_clauses = list(clauses) + ["ticket_status = 'Closed'"]
        closed_params = list(params)
        closed_where = " WHERE " + " AND ".join(closed_clauses) if closed_clauses else ""

        closed_total = connection.execute(
            f"SELECT COUNT(*) as cnt FROM historical_tickets {closed_where}",
            closed_params,
        ).fetchone()["cnt"]

        closed_available_clauses = list(clauses) + [
            "ticket_status = 'Closed'",
            "time_to_resolution IS NOT NULL",
        ]
        closed_available_params = list(params)
        closed_available_where = (
            " WHERE " + " AND ".join(closed_available_clauses)
            if closed_available_clauses else ""
        )
        closed_available = connection.execute(
            f"SELECT COUNT(*) as cnt FROM historical_tickets {closed_available_where}",
            closed_available_params,
        ).fetchone()["cnt"]
        closed_coverage = round((closed_available / closed_total) * 100, 1) if closed_total else 0.0

        # Min / max timestamps (of time_to_resolution, filtered by created_at)
        ts_row = connection.execute(f"""
            SELECT
                MIN(time_to_resolution) as min_ts,
                MAX(time_to_resolution) as max_ts
            FROM historical_tickets
            {res_not_null_where}
        """, res_not_null_params).fetchone()

        # Breakdown by Ticket Type (filtered by created_at)
        type_rows = connection.execute(f"""
            SELECT
                ticket_type,
                COUNT(*) as total,
                SUM(CASE WHEN time_to_resolution IS NOT NULL THEN 1 ELSE 0 END) as available
            FROM historical_tickets
            {where_sql}
            GROUP BY ticket_type
            ORDER BY total DESC
        """, params).fetchall()

        # Breakdown by Ticket Priority (filtered by created_at)
        priority_rows = connection.execute(f"""
            SELECT
                ticket_priority,
                COUNT(*) as total,
                SUM(CASE WHEN time_to_resolution IS NOT NULL THEN 1 ELSE 0 END) as available
            FROM historical_tickets
            {where_sql}
            GROUP BY ticket_priority
            ORDER BY
                CASE ticket_priority
                    WHEN 'Critical' THEN 1
                    WHEN 'High' THEN 2
                    WHEN 'Medium' THEN 3
                    WHEN 'Low' THEN 4
                END
        """, params).fetchall()

        # Hour-of-day distribution (of time_to_resolution, filtered by created_at)
        hour_rows = connection.execute(f"""
            SELECT
                CAST(strftime('%H', time_to_resolution) AS INTEGER) as hour,
                COUNT(*) as cnt
            FROM historical_tickets
            {res_not_null_where}
            GROUP BY hour
            ORDER BY hour
        """, res_not_null_params).fetchall()

        return jsonify({
            "success": True,
            "data": {
                "total_tickets": total,
                "available_timestamps": available,
                "missing_timestamps": missing,
                "closed_tickets_total": closed_total,
                "closed_tickets_with_resolution": closed_available,
                "closed_coverage_percentage": closed_coverage,
                "min_timestamp": ts_row["min_ts"],
                "max_timestamp": ts_row["max_ts"],
                "by_ticket_type": [
                    {
                        "ticket_type": r["ticket_type"],
                        "total": r["total"],
                        "available": r["available"],
                        "missing": r["total"] - r["available"],
                        "coverage": round((r["available"] / r["total"]) * 100, 1) if r["total"] else 0.0,
                    }
                    for r in type_rows
                ],
                "by_ticket_priority": [
                    {
                        "ticket_priority": r["ticket_priority"],
                        "total": r["total"],
                        "available": r["available"],
                        "missing": r["total"] - r["available"],
                        "coverage": round((r["available"] / r["total"]) * 100, 1) if r["total"] else 0.0,
                    }
                    for r in priority_rows
                ],
                "hour_of_day": [
                    {"hour": r["hour"], "count": r["cnt"]}
                    for r in hour_rows
                ],
                "data_quality_note": (
                    "Resolution timestamps are recorded as-is from the source dataset. "
                    "Only Closed tickets are expected to have resolution timestamps. "
                    "No elapsed-duration or SLA metrics are calculated because "
                    "a verified ticket creation timestamp is unavailable."
                ),
            }
        })
    finally:
        connection.close()
