"""add progress meta & unique constraints for events/missions

Revision ID: 20250821_add_event_mission_progress_meta
Revises: 20250820_add_userreward_extended_fields
Create Date: 2025-08-21 12:00:00
"""
from __future__ import annotations
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

revision: str = '20250821_add_event_mission_progress_meta'
down_revision: Union[str, None] = '20250820_add_userreward_extended_fields'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

EVT_TABLE = 'event_participations'
MIS_TABLE = 'user_missions'

def _has_index(insp: Inspector, table: str, name: str) -> bool:
    try:
        return name in {i['name'] for i in insp.get_indexes(table)}
    except Exception:
        return False

def _has_column(insp: Inspector, table: str, col: str) -> bool:
    try:
        return col in {c['name'] for c in insp.get_columns(table)}
    except Exception:
        return False

def upgrade() -> None:
    conn = op.get_bind()
    insp = Inspector.from_engine(conn)  # type: ignore

    # event_participations: progress_version, last_progress_at
    if _has_column(insp, EVT_TABLE, 'id'):
        if not _has_column(insp, EVT_TABLE, 'progress_version'):
            op.add_column(EVT_TABLE, sa.Column('progress_version', sa.Integer(), nullable=False, server_default='0'))
        if not _has_column(insp, EVT_TABLE, 'last_progress_at'):
            op.add_column(EVT_TABLE, sa.Column('last_progress_at', sa.DateTime(), nullable=True))
        try:
            op.create_unique_constraint('uq_event_participation_user_event', EVT_TABLE, ['user_id', 'event_id'])
        except Exception:
            pass
        if not _has_index(insp, EVT_TABLE, 'ix_event_participations_user_completed'):
            op.create_index('ix_event_participations_user_completed', EVT_TABLE, ['user_id', 'completed', 'claimed_rewards'])

    # user_missions
    if _has_column(insp, MIS_TABLE, 'id'):
        if not _has_column(insp, MIS_TABLE, 'progress_version'):
            op.add_column(MIS_TABLE, sa.Column('progress_version', sa.Integer(), nullable=False, server_default='0'))
        if not _has_column(insp, MIS_TABLE, 'last_progress_at'):
            op.add_column(MIS_TABLE, sa.Column('last_progress_at', sa.DateTime(), nullable=True))
        try:
            op.create_unique_constraint('uq_user_mission_user_mission', MIS_TABLE, ['user_id', 'mission_id'])
        except Exception:
            pass
        if not _has_index(insp, MIS_TABLE, 'ix_user_missions_user_completed'):
            op.create_index('ix_user_missions_user_completed', MIS_TABLE, ['user_id', 'completed', 'claimed'])

    # backfill / drop server_default
    try:
        op.execute(f"UPDATE {EVT_TABLE} SET progress_version=0 WHERE progress_version IS NULL")
        op.execute(f"UPDATE {MIS_TABLE} SET progress_version=0 WHERE progress_version IS NULL")
    except Exception:
        pass
    try:
        with op.batch_alter_table(EVT_TABLE) as batch:
            batch.alter_column('progress_version', server_default=None)
        with op.batch_alter_table(MIS_TABLE) as batch:
            batch.alter_column('progress_version', server_default=None)
    except Exception:
        pass

def downgrade() -> None:
    for name, table in [
        ('ix_event_participations_user_completed', EVT_TABLE),
        ('ix_user_missions_user_completed', MIS_TABLE),
    ]:
        try:
            op.drop_index(name, table_name=table)
        except Exception:
            pass
    for name, table in [
        ('uq_event_participation_user_event', EVT_TABLE),
        ('uq_user_mission_user_mission', MIS_TABLE),
    ]:
        try:
            op.drop_constraint(name, table_name=table, type_='unique')
        except Exception:
            pass
    for col, table in [
        ('progress_version', EVT_TABLE),
        ('last_progress_at', EVT_TABLE),
        ('progress_version', MIS_TABLE),
        ('last_progress_at', MIS_TABLE),
    ]:
        try:
            op.drop_column(table, col)
        except Exception:
            pass
