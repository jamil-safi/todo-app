import pytest
from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework.test import APIClient
from todos.models import List, Task

User = get_user_model()


@pytest.fixture(autouse=True)
def clear_throttle_cache():
    """
    DRF's rate-throttling (login: 5/min, signup: 3/hour, password_reset: 3/hour)
    tracks request counts in Django's cache. Without this fixture, throttle
    state leaks between tests within the same pytest run — a test late in
    the file can fail with 429 Throttled purely because earlier, unrelated
    tests already used up the rate limit for that same endpoint.

    autouse=True means this runs before AND after every single test
    automatically, no need to reference it explicitly in each test.
    """
    cache.clear()
    yield
    cache.clear()


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