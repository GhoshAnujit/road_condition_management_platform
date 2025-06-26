from sqlalchemy import inspect
from app.db.session import engine

def check_tables():
    """Check if tables exist in the database"""
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print("Tables in database:")
    for table in tables:
        print(f"- {table}")

if __name__ == "__main__":
    check_tables() 