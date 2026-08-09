# core/tests/test_throttling.py
import pytest
from django.urls import reverse
from django.core.cache import cache
from django.test import override_settings

pytestmark = pytest.mark.django_db


@pytest.fixture(autouse=True)
def clear_cache():
    """Throttle counts live in cache, not the DB — DB rollback won't clear them.
    Without this, request counts leak between tests and cause order-dependent failures."""
    cache.clear()
    yield
    cache.clear()


# ---------- Login throttling ----------

def test_login_allows_requests_within_rate_limit(api_client, user):
    for _ in range(5):
        response = api_client.post(reverse('auth-login'), {
            "username": "wronguser",
            "password": "wrongpass",
        })
        assert response.status_code == 400  # normal failed-login, not throttled yet


def test_login_throttled_after_exceeding_rate_limit(api_client, user):
    for _ in range(5):
        api_client.post(reverse('auth-login'), {
            "username": "wronguser",
            "password": "wrongpass",
        })

    response = api_client.post(reverse('auth-login'), {
        "username": "wronguser",
        "password": "wrongpass",
    })
    assert response.status_code == 429
    assert "detail" in response.data


def test_login_throttle_applies_even_to_correct_credentials(api_client, user):
    # Throttling is by IP, not by success/failure — even valid logins count toward the limit
    for _ in range(5):
        api_client.post(reverse('auth-login'), {
            "username": user.username,
            "password": "StrongPass1!",
        })

    response = api_client.post(reverse('auth-login'), {
        "username": user.username,
        "password": "StrongPass1!",
    })
    assert response.status_code == 429


def test_login_throttle_is_per_ip_not_global(api_client, user):
    """Confirm throttle key includes IP — simulated by checking a second client-like
    instance with a different REMOTE_ADDR isn't affected by the first's usage."""
    for _ in range(5):
        api_client.post(
            reverse('auth-login'),
            {"username": "wronguser", "password": "wrongpass"},
            REMOTE_ADDR="1.1.1.1",
        )

    # First IP should now be throttled
    blocked_response = api_client.post(
        reverse('auth-login'),
        {"username": "wronguser", "password": "wrongpass"},
        REMOTE_ADDR="1.1.1.1",
    )
    assert blocked_response.status_code == 429

    # A different IP should still be allowed
    other_ip_response = api_client.post(
        reverse('auth-login'),
        {"username": "wronguser", "password": "wrongpass"},
        REMOTE_ADDR="2.2.2.2",
    )
    assert other_ip_response.status_code == 400  # not 429


# ---------- Password reset throttling ----------

def test_password_reset_request_allows_requests_within_limit(api_client, user):
    for _ in range(3):
        response = api_client.post(reverse('password-reset-request'), {"email": user.email})
        assert response.status_code == 200


def test_password_reset_request_throttled_after_limit(api_client, user):
    for _ in range(3):
        api_client.post(reverse('password-reset-request'), {"email": user.email})

    response = api_client.post(reverse('password-reset-request'), {"email": user.email})
    assert response.status_code == 429


def test_password_reset_throttle_applies_regardless_of_email_validity(api_client):
    # Throttle is per-IP, so it should fire even if every attempt uses a nonexistent email
    for _ in range(3):
        api_client.post(reverse('password-reset-request'), {"email": "ghost@example.com"})

    response = api_client.post(reverse('password-reset-request'), {"email": "ghost@example.com"})
    assert response.status_code == 429


# ---------- Signup throttling ----------

def test_signup_allows_requests_within_limit(api_client):
    for i in range(3):
        response = api_client.post(reverse('auth-signup'), {
            "username": f"userrrr{i}",
            "email": f"userrrr{i}@example.com",
            "first_name": "Test",
            "last_name": "User",
            "password": "StrongPass1!",
            "confirm_password": "StrongPass1!",
        })
        assert response.status_code == 201


def test_signup_throttled_after_limit(api_client):
    for i in range(3):
        api_client.post(reverse('auth-signup'), {
            "username": f"userrrr{i}",
            "email": f"userrrr{i}@example.com",
            "first_name": "Test",
            "last_name": "User",
            "password": "StrongPass1!",
            "confirm_password": "StrongPass1!",
        })

    response = api_client.post(reverse('auth-signup'), {
        "username": "userrrr_extra",
        "email": "userrrr_extra@example.com",
        "first_name": "Test",
        "last_name": "User",
        "password": "StrongPass1!",
        "confirm_password": "StrongPass1!",
    })
    assert response.status_code == 429


# ---------- Throttle response shape ----------

def test_throttled_response_includes_wait_time_message(api_client, user):
    for _ in range(5):
        api_client.post(reverse('auth-login'), {
            "username": "wronguser",
            "password": "wrongpass",
        })

    response = api_client.post(reverse('auth-login'), {
        "username": "wronguser",
        "password": "wrongpass",
    })
    assert response.status_code == 429
    assert "throttled" in response.data["detail"].lower()