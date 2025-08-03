# cc-webapp/backend/app/apscheduler_jobs.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler
# from apscheduler.schedulers.background import BackgroundScheduler # if not using asyncio for FastAPI
from .utils.segment_utils import compute_rfm_and_update_segments
# Ensure database.py defines SessionLocal. If it's not created yet, this import will fail at runtime.
# For now, assuming database.py and SessionLocal will be available.
from .database import SessionLocal
from datetime import datetime, timedelta
import logging # For better logging from scheduler

# Configure logging for APScheduler for better visibility
logging.basicConfig()
logging.getLogger('apscheduler').setLevel(logging.INFO)


# Using AsyncIOScheduler as FastAPI is async
scheduler = AsyncIOScheduler(timezone="UTC") # Or your preferred timezone

def job_function():
    """Wrapper to manage DB session for the scheduled job."""
    db = None
    try:
        db = SessionLocal()
        print(f"[{datetime.utcnow()}] APScheduler: Running compute_rfm_and_update_segments job.")
        compute_rfm_and_update_segments(db)
        print(f"[{datetime.utcnow()}] APScheduler: compute_rfm_and_update_segments job finished.")
    except Exception as e:
        print(f"[{datetime.utcnow()}] APScheduler: Error in job_function: {e}")
        logging.exception("APScheduler job_function error") # Log full traceback
    finally:
        if db:
            db.close()

def start_scheduler():
    if scheduler.running:
        print(f"[{datetime.utcnow()}] APScheduler: Scheduler already running.")
        return

    # Schedule to run daily at 2 AM UTC
    scheduler.add_job(job_function, 'cron', hour=2, minute=0, misfire_grace_time=3600) # Misfire grace time of 1hr

    # Run once on startup for local testing/verification (5 seconds after app start)
    # This helps confirm the job setup without waiting for 2 AM.
    scheduler.add_job(job_function, 'date', run_date=datetime.now() + timedelta(seconds=10))

    try:
        scheduler.start()
        print(f"[{datetime.utcnow()}] APScheduler: Started successfully. RFM job scheduled.")
    except Exception as e:
        print(f"[{datetime.utcnow()}] APScheduler: Error starting: {e}")
        logging.exception("APScheduler startup error")


# To integrate with FastAPI, call start_scheduler() in main.py's startup event
# Example in app/main.py:
# from .apscheduler_jobs import start_scheduler
# @app.on_event("startup")
# async def startup_event():
#     print("FastAPI startup event: Initializing scheduler...")
#     start_scheduler()
#
# @app.on_event("shutdown")
# async def shutdown_event():
#     if scheduler.running:
#          scheduler.shutdown()
