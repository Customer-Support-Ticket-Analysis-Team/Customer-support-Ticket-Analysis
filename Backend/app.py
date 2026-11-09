from flask import Flask
from database import create_table
from routes.analytics import analytics_bp
from routes.dashboard import dashboard_bp
from routes.export import export_bp
from routes.health import health_bp
from routes.historical import historical_bp
from routes.ticket import tickets_bp
from flask_cors import CORS

app = Flask(__name__)
CORS(app)
app.register_blueprint(analytics_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(export_bp)
app.register_blueprint(health_bp)
app.register_blueprint(historical_bp)
app.register_blueprint(tickets_bp)

# Database initialize
create_table()

# Auto-import historical CSV data on startup so dashboards show data immediately.
# Uses INSERT OR IGNORE, so re-imports are safe (duplicates skipped).
from database import import_historical_csv  # noqa: E402
from routes.historical import DEFAULT_CSV_PATH  # noqa: E402
import os  # noqa: E402
if os.path.exists(DEFAULT_CSV_PATH):
    import_historical_csv(DEFAULT_CSV_PATH)

if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
