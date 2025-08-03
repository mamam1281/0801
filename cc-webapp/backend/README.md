# CC Webapp - Backend

This directory contains the FastAPI backend for the CC Webapp.

## Running the Application

There are two primary ways to run the backend application: using Docker Compose (recommended for a full-stack environment) or running locally using a Python virtual environment (for backend-focused development).

### 1. Running with Docker Compose (Recommended)

This method uses Docker Compose to build and run all services, including the backend, database, Redis, and Kafka, as defined in the main `cc-webapp/docker-compose.yml` file.

1.  **Prerequisites:**
    *   Docker and Docker Compose installed.
2.  **Environment Variables:**
    *   Create a `.env` file in the `cc-webapp` project root (next to `docker-compose.yml`). You can copy `cc-webapp/backend/.env.example` to `cc-webapp/.env` as a starting point, but ensure variable names match those expected by `docker-compose.yml` (e.g., `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `JWT_SECRET`, etc.).
3.  **Build and Start Services:**
    *   Navigate to the main project root directory (`cc-webapp`).
    *   Run the command:
        ```bash
        docker-compose up --build
        ```
    *   This will build the Docker images for the backend and frontend (if not already built) and start all services.
    *   The backend service will be available at `http://localhost:8000` (or the port specified by `BACKEND_PORT` in your `.env` file).
4.  **Database Migrations:**
    *   Database migrations (using Alembic) are automatically run by the `entrypoint.sh` script when the `backend` container starts. You do not need to run `alembic upgrade head` manually when using Docker Compose.

### 2. Local Development (without Docker)

This method is suitable for developing and testing the backend in isolation.

1.  **Prerequisites:**
    *   Python 3.9+ installed.
    *   Access to running instances of PostgreSQL, Redis, and Kafka (their URLs will be needed in the `.env` file).
2.  **Setup:**
    *   Navigate to the `cc-webapp/backend` directory.
    *   Create and activate a Python virtual environment:
        ```bash
        python -m venv venv
        source venv/bin/activate  # On Windows: venv\Scripts\activate
        ```
    *   Install dependencies:
        ```bash
        pip install -r requirements.txt
        ```
    *   Set up environment variables:
        *   Copy `.env.example` to `.env` within the `cc-webapp/backend` directory.
        *   Update variables in this `.env` file to point to your manually managed PostgreSQL, Redis, and Kafka instances.
        *   `SEGMENT_PROB_ADJUST_JSON` 및 `HOUSE_EDGE_JSON` 값을 지정하여 사용자 세그먼트별 확률 조정과 하우스 엣지를 설정할 수 있습니다.
    *   Apply database migrations manually:
        ```bash
        alembic upgrade head
        ```
3.  **Run the FastAPI Development Server:**
    ```bash
    uvicorn app.main:app --reload --port 8000
    ```
    The API will be available at `http://localhost:8000`.

## Monitoring & Health

The backend exposes the following endpoints for monitoring and health checks:

*   **`GET /health`**:
    *   Returns `{"status": "healthy"}`.
    *   This endpoint is used by Docker Compose for the backend service's health check and can be utilized by other monitoring systems to verify application status.
*   **`GET /metrics`**:
    *   Exposes application metrics in Prometheus format. These metrics can be scraped by a Prometheus server for monitoring and alerting.
    *   Includes default metrics provided by `prometheus-fastapi-instrumentator`, such as HTTP request counts, request latencies, and in-progress requests.

## Key Features & Integrations

### 1. Kafka Integration for User Actions
-   All user actions submitted via the `POST /api/actions` endpoint are published as JSON messages to the Kafka topic `topic_user_actions`.
-   The message payload includes `{ user_id, action_type, action_timestamp }`.
-   A consumer script is available at `scripts/kafka_consumer.py` which can be run to observe these messages in real-time:
    ```bash
    python scripts/kafka_consumer.py
    ```
-   This integration requires a Kafka broker running and accessible via the `KAFKA_BROKER` environment variable.

### 2. RFM Batch Job & User Segmentation
-   A daily batch job, `compute_rfm_and_update_segments` (located in `app/utils/segment_utils.py`), calculates Recency, Frequency, and Monetary (RFM) scores for users based on their actions in the last 30 days.
-   This job assigns users to RFM groups (e.g., "Whale", "Medium", "Low") and updates the `rfm_group` and `last_updated` fields in the `user_segments` table.
-   The job is scheduled using APScheduler (`app/apscheduler_jobs.py`) to run:
    -   Daily at 2:00 AM UTC.
    -   Once shortly after application startup for immediate processing in development/testing.
-   The logic for RFM calculation and group assignment should be detailed in the project's technical documentation (`02_data_personalization_en.md`).

### 3. Corporate Site Retention Integration
-   The `POST /api/notify/site_visit` endpoint is used to log instances where a user navigates from the webapp to an external corporate site.
-   It accepts a payload like `{ "user_id": 123, "source": "webapp_button" }`.
-   Logged visits are stored in the `site_visits` table, capturing `user_id`, `source`, and `visit_timestamp`.

### 4. Personalized Recommendation Endpoint
-   The `GET /api/user-segments/{user_id}/recommendation` endpoint provides personalized recommendations for users.
-   It considers the user's:
    -   `rfm_group` (from the `user_segments` table).
    -   `risk_profile` (from the `user_segments` table).
    -   Current `streak_count` (fetched from a Redis key like `user:{user_id}:streak_count`).
-   The endpoint returns a JSON object containing `recommended_reward_probability` and `recommended_time_window`, calculated based on logic outlined in the project's technical documentation (`02_data_personalization_en.md`).
-   Requires Redis to be running and accessible via the `REDIS_URL` environment variable.

## Testing
Unit tests are located in the `tests/` directory and can be run using pytest:
```bash
# Ensure you are in the cc-webapp/backend directory or set PYTHONPATH appropriately
# Example from cc-webapp directory:
# PYTHONPATH=. pytest backend/tests/
# Or from cc-webapp/backend directory:
pytest
```

To run tests via Docker Compose (ensure services are up, e.g., `docker-compose up -d backend db` or the full stack):
```bash
# From the project root (cc-webapp directory)
docker-compose exec backend pytest tests/
```

### Vulnerability Scanning (Backend)

To check for known vulnerabilities in Python dependencies, you can use tools like `pip-audit` or `safety`.

1.  **Using `pip-audit` (Recommended by PyPA):**
    *   Ensure `pip-audit` is installed in your development environment or CI runner:
        ```bash
        pip install pip-audit
        ```
    *   Navigate to the `cc-webapp/backend` directory (where `requirements.txt` is located) and run:
        ```bash
        pip-audit
        ```
    *   To make this a CI check that fails on any vulnerability:
        ```bash
        pip-audit --fail-on-vulnerability
        ```
    *   `pip-audit` uses data from the Python Packaging Advisory Database (PyPI Advisory DB) and others.

2.  **Using `safety` (Alternative):**
    *   Ensure `safety` is installed:
        ```bash
        pip install safety
        ```
    *   Navigate to the `cc-webapp/backend` directory and run:
        ```bash
        safety check -r requirements.txt
        ```
    *   `safety` uses its own vulnerability database (requires a free or commercial license for the latest data, otherwise uses a freely available but potentially delayed database).

Regularly review the output from these tools and update your dependencies in `requirements.txt` as needed, testing thoroughly for compatibility.
