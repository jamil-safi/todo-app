# core/tests/test_password_reset.py
import pytest
from django.urls import reverse
from django.core import mail
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken

pytestmark = pytest.mark.django_db


def get_uid_and_token_for(user):
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    return uid, token


def test_request_reset_with_existing_email_sends_mail(api_client, user):
    response = api_client.post(reverse('password-reset-request'), {"email": user.email})
    assert response.status_code == 200
    assert len(mail.outbox) == 1
    assert user.email in mail.outbox[0].to


def test_request_reset_with_nonexistent_email_returns_generic_message(api_client):
    response = api_client.post(reverse('password-reset-request'), {"email": "ghost@example.com"})
    assert response.status_code == 200
    assert len(mail.outbox) == 0  # no email actually sent


def test_request_reset_responses_are_identical_for_existing_and_nonexistent_email(api_client, user):
    response_real = api_client.post(reverse('password-reset-request'), {"email": user.email})
    response_fake = api_client.post(reverse('password-reset-request'), {"email": "ghost@example.com"})
    assert response_real.data == response_fake.data
    assert response_real.status_code == response_fake.status_code


def test_request_reset_with_invalid_email_format_fails(api_client):
    response = api_client.post(reverse('password-reset-request'), {"email": "not-an-email"})
    assert response.status_code == 400
    assert "email" in response.data


def test_request_reset_email_contains_uid_and_token(api_client, user):
    api_client.post(reverse('password-reset-request'), {"email": user.email})
    email_body = mail.outbox[0].body
    assert "uid=" in email_body
    assert "token=" in email_body



def test_confirm_reset_with_valid_token_succeeds(api_client, user):
    uid, token = get_uid_and_token_for(user)
    response = api_client.post(reverse('password-reset-confirm'), {
        "uid": uid,
        "token": token,
        "new_password": "NewStrongPass1!",
        "confirm_new_password": "NewStrongPass1!",
    })
    assert response.status_code == 200
    user.refresh_from_db()
    assert user.check_password("NewStrongPass1!")


def test_confirm_reset_with_invalid_token_fails(api_client, user):
    uid, _ = get_uid_and_token_for(user)
    response = api_client.post(reverse('password-reset-confirm'), {
        "uid": uid,
        "token": "totally-invalid-token",
        "new_password": "NewStrongPass1!",
        "confirm_new_password": "NewStrongPass1!",
    })
    assert response.status_code == 400
    assert "token" in response.data


def test_confirm_reset_with_invalid_uid_fails(api_client, user):
    _, token = get_uid_and_token_for(user)
    response = api_client.post(reverse('password-reset-confirm'), {
        "uid": "not-a-real-uid",
        "token": token,
        "new_password": "NewStrongPass1!",
        "confirm_new_password": "NewStrongPass1!",
    })
    assert response.status_code == 400
    assert "token" in response.data


def test_confirm_reset_token_cannot_be_reused(api_client, user):
    uid, token = get_uid_and_token_for(user)

    first_response = api_client.post(reverse('password-reset-confirm'), {
        "uid": uid,
        "token": token,
        "new_password": "NewStrongPass1!",
        "confirm_new_password": "NewStrongPass1!",
    })
    assert first_response.status_code == 200

    # Try reusing the same token again — should fail, since password already changed
    second_response = api_client.post(reverse('password-reset-confirm'), {
        "uid": uid,
        "token": token,
        "new_password": "AnotherPass1!",
        "confirm_new_password": "AnotherPass1!",
    })
    assert second_response.status_code == 400
    assert "token" in second_response.data


def test_confirm_reset_with_mismatched_passwords_fails(api_client, user):
    uid, token = get_uid_and_token_for(user)
    response = api_client.post(reverse('password-reset-confirm'), {
        "uid": uid,
        "token": token,
        "new_password": "NewStrongPass1!",
        "confirm_new_password": "DifferentPass1!",
    })
    assert response.status_code == 400
    assert "confirm_new_password" in response.data


def test_confirm_reset_with_weak_password_fails(api_client, user):
    uid, token = get_uid_and_token_for(user)
    response = api_client.post(reverse('password-reset-confirm'), {
        "uid": uid,
        "token": token,
        "new_password": "weak",
        "confirm_new_password": "weak",
    })
    assert response.status_code == 400
    assert "new_password" in response.data


def test_confirm_reset_token_for_different_user_fails(api_client, user, other_user):
    # generate a valid token for `user`, but try applying it to `other_user`'s uid
    _, token = get_uid_and_token_for(user)
    other_uid = urlsafe_base64_encode(force_bytes(other_user.pk))

    response = api_client.post(reverse('password-reset-confirm'), {
        "uid": other_uid,
        "token": token,
        "new_password": "NewStrongPass1!",
        "confirm_new_password": "NewStrongPass1!",
    })
    assert response.status_code == 400
    assert "token" in response.data



def test_successful_reset_blacklists_existing_refresh_tokens(api_client, user):
    refresh = RefreshToken.for_user(user)
    outstanding = OutstandingToken.objects.get(jti=refresh["jti"])
    assert not BlacklistedToken.objects.filter(token=outstanding).exists()

    uid, token = get_uid_and_token_for(user)
    response = api_client.post(reverse('password-reset-confirm'), {
        "uid": uid,
        "token": token,
        "new_password": "NewStrongPass1!",
        "confirm_new_password": "NewStrongPass1!",
    })
    assert response.status_code == 200
    assert BlacklistedToken.objects.filter(token=outstanding).exists()



def test_request_reset_does_not_require_authentication(api_client, user):
    response = api_client.post(reverse('password-reset-request'), {"email": user.email})
    assert response.status_code != 401


def test_confirm_reset_does_not_require_authentication(api_client, user):
    uid, token = get_uid_and_token_for(user)
    response = api_client.post(reverse('password-reset-confirm'), {
        "uid": uid,
        "token": token,
        "new_password": "NewStrongPass1!",
        "confirm_new_password": "NewStrongPass1!",
    })
    assert response.status_code != 401