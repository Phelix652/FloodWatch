import sqlite3

connection = sqlite3.connect("../database/floodwatch.db")

cursor = connection.cursor()

cursor.execute("SELECT * FROM reports")

rows = cursor.fetchall()

print("\n===== FLOODWATCH DATABASE =====\n")

for row in rows:
    print(row)

connection.close()