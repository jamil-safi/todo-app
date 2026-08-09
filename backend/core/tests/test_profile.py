import pytest
from django.urls import reverse
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken

pytestmark = pytest.mark.django_db


# ---------- View profile ----------

def test_can_view_own_profile(authenticated_client):
    client, user = authenticated_client
    response = client.get(reverse('auth-profile'))
    assert response.status_code == 200
    assert response.data["username"] == user.username
    assert response.data["email"] == user.email


def test_unauthenticated_user_cannot_view_profile(api_client):
    response = api_client.get(reverse('auth-profile'))
    assert response.status_code == 401


# ---------- Username / email lockdown ----------

def test_cannot_update_username(authenticated_client):
    client, user = authenticated_client
    old_username = user.username
    response = client.patch(reverse('auth-profile'), {"username": "hacked_name"})
    user.refresh_from_db()
    assert response.status_code == 200  # request succeeds, field is just silently ignored
    assert user.username == old_username


def test_cannot_update_email(authenticated_client):
    client, user = authenticated_client
    old_email = user.email
    response = client.patch(reverse('auth-profile'), {"email": "hacked@example.com"})
    user.refresh_from_db()
    assert response.status_code == 200
    assert user.email == old_email


# ---------- Name changes require current_password ----------

def test_updating_name_without_password_fails(authenticated_client):
    client, user = authenticated_client
    response = client.patch(reverse('auth-profile'), {"first_name": "Changed"})
    assert response.status_code == 400
    assert "current_password" in response.data
    user.refresh_from_db()
    assert user.first_name != "Changed"


def test_updating_name_with_wrong_password_fails(authenticated_client):
    client, user = authenticated_client
    response = client.patch(reverse('auth-profile'), {
        "first_name": "Changed",
        "current_password": "WrongPassword1!",
    })
    assert response.status_code == 400
    assert "current_password" in response.data
    user.refresh_from_db()
    assert user.first_name != "Changed"


def test_updating_name_with_correct_password_succeeds(authenticated_client):
    client, user = authenticated_client
    response = client.patch(reverse('auth-profile'), {
        "first_name": "Changed",
        "last_name": "AlsoChanged",
        "current_password": "StrongPass1!",
    })
    assert response.status_code == 200
    user.refresh_from_db()
    assert user.first_name == "Changed"
    assert user.last_name == "AlsoChanged"


def test_noop_patch_does_not_require_password(authenticated_client):
    client, user = authenticated_client
    response = client.patch(reverse('auth-profile'), {
        "first_name": user.first_name,  # unchanged value
        "last_name": user.last_name,     # unchanged value
    })
    assert response.status_code == 200


def test_empty_patch_succeeds_without_password(authenticated_client):
    client, user = authenticated_client
    response = client.patch(reverse('auth-profile'), {})
    assert response.status_code == 200


# ---------- Password change ----------

def test_changing_password_without_current_password_fails(authenticated_client):
    client, user = authenticated_client
    response = client.patch(reverse('auth-profile'), {
        "new_password": "NewStrongPass1!",
        "confirm_new_password": "NewStrongPass1!",
    })
    assert response.status_code == 400
    assert "current_password" in response.data


def test_changing_password_with_wrong_current_password_fails(authenticated_client):
    client, user = authenticated_client
    response = client.patch(reverse('auth-profile'), {
        "current_password": "WrongPassword1!",
        "new_password": "NewStrongPass1!",
        "confirm_new_password": "NewStrongPass1!",
    })
    assert response.status_code == 400
    assert "current_password" in response.data


def test_changing_password_with_mismatched_confirmation_fails(authenticated_client):
    client, user = authenticated_client
    response = client.patch(reverse('auth-profile'), {
        "current_password": "StrongPass1!",
        "new_password": "NewStrongPass1!",
        "confirm_new_password": "DifferentPass1!",
    })
    assert response.status_code == 400
    assert "confirm_new_password" in response.data


def test_changing_password_with_weak_new_password_fails(authenticated_client):
    client, user = authenticated_client
    response = client.patch(reverse('auth-profile'), {
        "current_password": "StrongPass1!",
        "new_password": "weak",
        "confirm_new_password": "weak",
    })
    assert response.status_code == 400
    assert "new_password" in response.data


def test_changing_password_succeeds_with_valid_data(authenticated_client):
    client, user = authenticated_client
    response = client.patch(reverse('auth-profile'), {
        "current_password": "StrongPass1!",
        "new_password": "NewStrongPass1!",
        "confirm_new_password": "NewStrongPass1!",
    })
    assert response.status_code == 200
    user.refresh_from_db()
    assert user.check_password("NewStrongPass1!")
    assert not user.check_password("StrongPass1!")


def test_changing_password_missing_confirm_field_fails(authenticated_client):
    client, user = authenticated_client
    response = client.patch(reverse('auth-profile'), {
        "current_password": "StrongPass1!",
        "new_password": "NewStrongPass1!",
    })
    assert response.status_code == 400
    assert "new_password" in response.data


# ---------- Password change invalidates existing sessions ----------

def test_changing_password_blacklists_existing_refresh_tokens(authenticated_client, user):
    client, auth_user = authenticated_client

    # Simulate an existing "logged in elsewhere" refresh token
    refresh = RefreshToken.for_user(auth_user)
    outstanding = OutstandingToken.objects.get(jti=refresh["jti"])
    assert not BlacklistedToken.objects.filter(token=outstanding).exists()

    response = client.patch(reverse('auth-profile'), {
        "current_password": "StrongPass1!",
        "new_password": "NewStrongPass1!",
        "confirm_new_password": "NewStrongPass1!",
    })
    assert response.status_code == 200

    assert BlacklistedToken.objects.filter(token=outstanding).exists()


def test_changing_only_name_does_not_blacklist_tokens(authenticated_client):
    client, user = authenticated_client

    refresh = RefreshToken.for_user(user)
    outstanding = OutstandingToken.objects.get(jti=refresh["jti"])

    response = client.patch(reverse('auth-profile'), {
        "first_name": "Changed",
        "current_password": "StrongPass1!",
    })
    assert response.status_code == 200
    assert not BlacklistedToken.objects.filter(token=outstanding).exists()


# ---------- Response shape ----------

def test_profile_response_never_includes_password_fields(authenticated_client):
    client, user = authenticated_client
    response = client.patch(reverse('auth-profile'), {
        "first_name": "Changed",
        "current_password": "StrongPass1!",
    })
    assert "password" not in response.data
    assert "new_password" not in response.data
    assert "current_password" not in response.data