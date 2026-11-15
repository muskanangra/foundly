"""Initial schema: all tables + seed categories

Revision ID: 0001
Revises:
Create Date: 2025-11-15
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── users ─────────────────────────────────────────────────────────────────
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(60), nullable=False),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column(
            "role",
            sa.String(10),
            nullable=False,
            server_default="user",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.CheckConstraint("role IN ('user', 'admin')", name="users_role_check"),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    # ── categories ────────────────────────────────────────────────────────────
    op.create_table(
        "categories",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(80), nullable=False),
        sa.Column("slug", sa.String(80), nullable=False, unique=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_categories_slug", "categories", ["slug"], unique=True)

    # ── found_items ───────────────────────────────────────────────────────────
    op.create_table(
        "found_items",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "owner_id",
            sa.Integer,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "category_id",
            sa.Integer,
            sa.ForeignKey("categories.id", ondelete="RESTRICT"),
            nullable=False,
        ),
        sa.Column("name", sa.String(80), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("location", sa.String(80), nullable=False),
        sa.Column("found_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("image_path", sa.String(255), nullable=False),
        sa.Column(
            "status",
            sa.String(10),
            nullable=False,
            server_default="active",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.CheckConstraint(
            "status IN ('active', 'returned', 'removed')",
            name="found_items_status_check",
        ),
    )
    op.create_index("ix_found_items_owner_id", "found_items", ["owner_id"])
    op.create_index("ix_found_items_category_id", "found_items", ["category_id"])
    op.create_index("ix_found_items_status", "found_items", ["status"])
    op.create_index("ix_found_items_found_at", "found_items", ["found_at"])
    op.create_index("ix_found_items_created_at", "found_items", ["created_at"])

    # ── conversations ─────────────────────────────────────────────────────────
    op.create_table(
        "conversations",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "item_id",
            sa.Integer,
            sa.ForeignKey("found_items.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "finder_id",
            sa.Integer,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "claimant_id",
            sa.Integer,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "status",
            sa.String(10),
            nullable=False,
            server_default="open",
        ),
        sa.Column("finder_last_read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("claimant_last_read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.CheckConstraint(
            "status IN ('open', 'resolved')",
            name="conversations_status_check",
        ),
        sa.UniqueConstraint("item_id", "claimant_id", name="conversations_item_claimant_unique"),
    )
    op.create_index("ix_conversations_item_id", "conversations", ["item_id"])
    op.create_index("ix_conversations_finder_id", "conversations", ["finder_id"])
    op.create_index("ix_conversations_claimant_id", "conversations", ["claimant_id"])

    # ── messages ──────────────────────────────────────────────────────────────
    op.create_table(
        "messages",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "conversation_id",
            sa.Integer,
            sa.ForeignKey("conversations.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "sender_id",
            sa.Integer,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("text", sa.Text, nullable=True),
        sa.Column("image_path", sa.String(255), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_messages_conversation_id", "messages", ["conversation_id"])
    op.create_index("ix_messages_sender_id", "messages", ["sender_id"])
    op.create_index("ix_messages_created_at", "messages", ["created_at"])

    # ── notifications ─────────────────────────────────────────────────────────
    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("type", sa.String(10), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("body", sa.Text, nullable=False),
        sa.Column("link", sa.String(255), nullable=False),
        sa.Column(
            "is_read",
            sa.Boolean,
            nullable=False,
            server_default=sa.text("false"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.CheckConstraint(
            "type IN ('message', 'match')",
            name="notifications_type_check",
        ),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])
    op.create_index("ix_notifications_created_at", "notifications", ["created_at"])

    # ── reports ───────────────────────────────────────────────────────────────
    op.create_table(
        "reports",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "item_id",
            sa.Integer,
            sa.ForeignKey("found_items.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "reporter_id",
            sa.Integer,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("reason", sa.String(20), nullable=False),
        sa.Column("note", sa.Text, nullable=True),
        sa.Column(
            "status",
            sa.String(10),
            nullable=False,
            server_default="open",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.CheckConstraint(
            "reason IN ('fake', 'inappropriate', 'duplicate', 'spam', 'other')",
            name="reports_reason_check",
        ),
        sa.CheckConstraint(
            "status IN ('open', 'dismissed', 'actioned')",
            name="reports_status_check",
        ),
    )
    op.create_index("ix_reports_item_id", "reports", ["item_id"])
    op.create_index("ix_reports_reporter_id", "reports", ["reporter_id"])
    op.create_index("ix_reports_status", "reports", ["status"])

    # ── match_alerts ──────────────────────────────────────────────────────────
    op.create_table(
        "match_alerts",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("keyword", sa.String(100), nullable=False),
        sa.Column(
            "category_id",
            sa.Integer,
            sa.ForeignKey("categories.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("location", sa.String(80), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
    )
    op.create_index("ix_match_alerts_user_id", "match_alerts", ["user_id"])

    # ── Trigger: auto-update found_items.updated_at ───────────────────────────
    op.execute("""
        CREATE OR REPLACE FUNCTION set_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """)
    op.execute("""
        CREATE TRIGGER found_items_updated_at
        BEFORE UPDATE ON found_items
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    """)

    # ── Seed categories (exactly 8, in this order) ────────────────────────────
    op.execute("""
        INSERT INTO categories (name, slug) VALUES
            ('Electronics',    'electronics'),
            ('Wallets',        'wallets'),
            ('Accessories',    'accessories'),
            ('Clothing',       'clothing'),
            ('Stationery',     'stationery'),
            ('Documents',      'documents'),
            ('Water bottles',  'water-bottles'),
            ('Other',          'other')
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS found_items_updated_at ON found_items")
    op.execute("DROP FUNCTION IF EXISTS set_updated_at")
    op.drop_table("match_alerts")
    op.drop_table("reports")
    op.drop_table("notifications")
    op.drop_table("messages")
    op.drop_table("conversations")
    op.drop_table("found_items")
    op.drop_table("categories")
    op.drop_table("users")
