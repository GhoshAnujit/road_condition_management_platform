from app.db.session import engine, Base
from app.models.defect import Defect
from app.models.user import User

def create_tables():
    """Create all tables in the database"""
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")

if __name__ == "__main__":
    create_tables() 