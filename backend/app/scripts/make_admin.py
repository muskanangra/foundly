"""
Promote a user to admin by email.

Usage (from the backend/ directory):
    python -m app.scripts.make_admin someone@email.com
"""

import sys
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User


def make_admin(email: str) -> None:
    email = email.strip().lower()
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user is None:
            print(f"Error: no user found with email '{email}'")
            sys.exit(1)
        if user.role == "admin":
            print(f"User '{user.name}' ({email}) is already an admin.")
            return
        user.role = "admin"
        db.commit()
        print(f"Success: '{user.name}' ({email}) is now an admin.")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python -m app.scripts.make_admin <email>")
        sys.exit(1)
    make_admin(sys.argv[1])
