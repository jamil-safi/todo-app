import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from todos.models import List, Task

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def create_user(db):
    def _create_user(username = "jamil", email = "jamil@gmail.com", password = "StrongPass1!", **kwargs):
        return User.objects.create_user(
            username = username,
            email = email,
            password = password,
            **kwargs
        )
    return _create_user


@pytest.fixture
def user(create_user):
    return create_user()


@pytest.fixture
def other_user(create_user):
    return create_user(username = "safi" , email = "safi@gmail.com")


@pytest.fixture
def authenticated_client(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client, user


