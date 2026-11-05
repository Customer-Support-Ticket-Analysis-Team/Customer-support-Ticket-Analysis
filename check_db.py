import sys
sys.path.insert(0, 'Backend')
from database import get_connection

conn = get_connection()

# Check sample records
print('=== Sample historical records ===')
for row in conn.execute('SELECT * FROM historical_tickets LIMIT 5').fetchall():
    print(dict(row))

print()
print('=== First response time count ===')
print(conn.execute("SELECT COUNT(*) FROM historical_tickets WHERE first_response_time IS NOT NULL").fetchone()[0])

print()
print('=== Time to resolution count ===')
print(conn.execute("SELECT COUNT(*) FROM historical_tickets WHERE time_to_resolution IS NOT NULL").fetchone()[0])

print()
print('=== Satisfaction rating count ===')
print(conn.execute("SELECT COUNT(*) FROM historical_tickets WHERE customer_satisfaction_rating IS NOT NULL").fetchone()[0])

print()
print('=== Check a record with data ===')
for row in conn.execute("SELECT * FROM historical_tickets WHERE first_response_time IS NOT NULL LIMIT 3").fetchall():
    print(dict(row))

conn.close()
