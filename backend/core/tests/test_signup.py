import pytest
from django.urls import reverse
from django.contrib.auth import get_user_model

User = get_user_model()
pytestmark = pytest.mark.django_db


@pytest.fixture
def valid_payload():
    return {
        "username": "newuser",
        "email": "newuser@example.com",
        "first_name": "New",
        "last_name": "User",
        "password": "StrongPass1!",
        "confirm_password": "StrongPass1!",
    }


def test_signup_success(api_client, valid_payload):
    response = api_client.post(reverse('auth-signup'), valid_payload)
    assert response.status_code == 201
    assert User.objects.filter(username="newuser").exists()


def test_signup_creates_default_list(api_client, valid_payload):
    api_client.post(reverse('auth-signup'), valid_payload)
    created_user = User.objects.get(username="newuser")
    assert created_user.lists.filter(is_default=True, title="My Todos").exists()


def test_signup_password_mismatch(api_client, valid_payload):
    payload = {**valid_payload, "confirm_password": "Different1!"}
    response = api_client.post(reverse('auth-signup'), payload)
    assert response.status_code == 400
    assert "confirm_password" in response.data


def test_signup_duplicate_email_rejected(api_client, valid_payload, user):
    payload = {**valid_payload, "email": user.email}
    response = api_client.post(reverse('auth-signup'), payload)
    assert response.status_code == 400
    assert "email" in response.data


def test_signup_duplicate_username_rejected(api_client, valid_payload, user):
    payload = {**valid_payload, "username": user.username}
    response = api_client.post(reverse('auth-signup'), payload)
    assert response.status_code == 400
    assert "username" in response.data