import pytest
from django.urls import reverse

pytestmark = pytest.mark.django_db


def test_login_with_username_succeeds(api_client, user):
    response = api_client.post(reverse('auth-login'), {
        "username": user.username,
        "password": "StrongPass1!",
    })
    assert response.status_code == 200


def test_login_with_email_succeeds(api_client, user):
    response = api_client.post(reverse('auth-login'), {
        "username": user.email,
        "password": "StrongPass1!",
    })
    assert response.status_code == 200


def test_login_fails_with_wrong_password(api_client, user):
    response = api_client.post(reverse('auth-login'), {
        "username": user.username,
        "password": "WrongPassword1!",
    })
    assert response.status_code == 400


def test_login_fails_with_nonexistent_user(api_client):
    response = api_client.post(reverse('auth-login'), {
        "username": "ghostuser",
        "password": "SomePassword1!",
    })
    assert response.status_code == 400


def test_login_sets_access_and_refresh_cookies(api_client, user):
    response = api_client.post(reverse('auth-login'), {
        "username": user.username,
        "password": "StrongPass1!",
    })
    assert "access_token" in response.cookies
    assert "refresh_token" in response.cookies


def test_login_cookies_are_httponly(api_client, user):
    response = api_client.post(reverse('auth-login'), {
        "username": user.username,
        "password": "StrongPass1!",
    })
    assert response.cookies["access_token"]["httponly"] is True
    assert response.cookies["refresh_token"]["httponly"] is True