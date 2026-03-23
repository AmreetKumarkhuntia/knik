"""
Scheduler data-access service.

Only contains the SchedulerDB client — all product logic (models, engine,
nodes, scheduler, services) has moved to lib.cron.
"""

from .db_client import SchedulerDB


__all__ = ["SchedulerDB"]
