import pytest
from todos.models import List

pytestmark = pytest.mark.django_db


def test_user_can_create_list(authenticated_client):
    client, user = authenticated_client
    response = client.post('/todos/lists/', {"title": "Groceries", "display_order": 1})
    assert response.status_code == 201
    assert List.objects.filter(title="Groceries", owner=user).exists()


def test_list_response_includes_task_count(authenticated_client):
    client, user = authenticated_client
    response = client.post('/todos/lists/', {"title": "Groceries", "display_order": 1})
    assert response.data["task_count"] == 0


def test_user_can_see_own_lists(authenticated_client):
    client, user = authenticated_client
    List.objects.create(owner=user, title="Work")
    response = client.get('/todos/lists/')
    titles = [item['title'] for item in response.data['results']]
    assert "Work" in titles


def test_user_cannot_see_others_lists(authenticated_client, other_user):
    client, user = authenticated_client
    List.objects.create(owner=other_user, title="Jane's List")
    response = client.get('/todos/lists/')
    titles = [item['title'] for item in response.data['results']]
    assert "Jane's List" not in titles


def test_unauthenticated_user_cannot_access_lists(api_client):
    response = api_client.get('/todos/lists/')
    assert response.status_code == 401


def test_signup_creates_default_list_for_new_user(authenticated_client):
    client, user = authenticated_client
    assert user.lists.filter(is_default=True, title="My Todos").exists()


def test_user_cannot_delete_default_list(authenticated_client):
    client, user = authenticated_client
    default_list = user.lists.get(is_default=True)
    response = client.delete(f'/todos/lists/{default_list.id}/')
    assert response.status_code == 403


def test_user_can_delete_regular_list(authenticated_client):
    client, user = authenticated_client
    regular_list = List.objects.create(owner=user, title="Temp")
    response = client.delete(f'/todos/lists/{regular_list.id}/')
    assert response.status_code == 204
    assert not List.objects.filter(id=regular_list.id).exists()


def test_user_cannot_rename_default_list(authenticated_client):
    client, user = authenticated_client
    default_list = user.lists.get(is_default=True)
    response = client.patch(f'/todos/lists/{default_list.id}/', {"title": "Renamed"})
    assert response.status_code == 400


def test_user_cannot_reorder_default_list(authenticated_client):
    client, user = authenticated_client
    default_list = user.lists.get(is_default=True)
    response = client.patch(f'/todos/lists/{default_list.id}/', {"display_order": 99})
    assert response.status_code == 400


def test_noop_patch_on_default_list_succeeds(authenticated_client):
    client, user = authenticated_client
    default_list = user.lists.get(is_default=True)
    response = client.patch(f'/todos/lists/{default_list.id}/', {"title": default_list.title})
    assert response.status_code == 200


def test_user_cannot_create_task_under_others_list(authenticated_client, other_user):
    client, user = authenticated_client
    others_list = List.objects.create(owner=other_user, title="Jane's List")
    response = client.post('/todos/tasks/', {
        "list": str(others_list.id),
        "title": "Sneaky task",
    })
    assert response.status_code == 400
    assert "list" in response.data