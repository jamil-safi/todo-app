import pytest
from datetime import date, timedelta
from django.utils import timezone
from todos.models import List, Task

pytestmark = pytest.mark.django_db


@pytest.fixture
def user_list(authenticated_client):
    """A regular (non-default) list owned by the authenticated user."""
    client, user = authenticated_client
    return List.objects.create(owner=user, title="Groceries", display_order=1)




def test_user_can_create_task(authenticated_client, user_list):
    client, user = authenticated_client
    response = client.post('/todos/tasks/', {
        "list": str(user_list.id),
        "title": "Buy milk",
    })
    assert response.status_code == 201
    assert Task.objects.filter(title="Buy milk", owner=user, list=user_list).exists()


def test_task_response_uses_read_serializer_shape(authenticated_client, user_list):
    client, user = authenticated_client
    response = client.post('/todos/tasks/', {
        "list": str(user_list.id),
        "title": "Buy milk",
    })
    assert "completed_at" in response.data
    assert "created_at" in response.data


def test_user_cannot_create_task_under_others_list(authenticated_client, other_user):
    client, user = authenticated_client
    others_list = List.objects.create(owner=other_user, title="Jane's List")
    response = client.post('/todos/tasks/', {
        "list": str(others_list.id),
        "title": "Sneaky task",
    })
    assert response.status_code == 400
    assert "list" in response.data


def test_cannot_create_task_with_past_due_date(authenticated_client, user_list):
    client, user = authenticated_client
    yesterday = (timezone.now().date() - timedelta(days=1)).isoformat()
    response = client.post('/todos/tasks/', {
        "list": str(user_list.id),
        "title": "Old task",
        "due_date": yesterday,
    })
    assert response.status_code == 400
    assert "due_date" in response.data


def test_cannot_create_task_with_past_reminder(authenticated_client, user_list):
    client, user = authenticated_client
    past_reminder = (timezone.now() - timedelta(hours=1)).isoformat()
    response = client.post('/todos/tasks/', {
        "list": str(user_list.id),
        "title": "Old reminder task",
        "reminder_at": past_reminder,
    })
    assert response.status_code == 400
    assert "reminder_at" in response.data


def test_can_create_task_with_future_due_date(authenticated_client, user_list):
    client, user = authenticated_client
    tomorrow = (date.today() + timedelta(days=1)).isoformat()
    response = client.post('/todos/tasks/', {
        "list": str(user_list.id),
        "title": "Future task",
        "due_date": tomorrow,
    })
    assert response.status_code == 201


def test_can_create_task_without_due_date(authenticated_client, user_list):
    client, user = authenticated_client
    response = client.post('/todos/tasks/', {
        "list": str(user_list.id),
        "title": "No due date task",
    })
    assert response.status_code == 201


# ---------- Read ----------

def test_user_can_see_own_tasks(authenticated_client, user_list):
    client, user = authenticated_client
    Task.objects.create(owner=user, list=user_list, title="Buy milk")
    response = client.get('/todos/tasks/')
    titles = [item['title'] for item in response.data['results']]
    assert "Buy milk" in titles


def test_user_cannot_see_others_tasks(authenticated_client, other_user):
    client, user = authenticated_client
    others_list = List.objects.create(owner=other_user, title="Jane's List")
    Task.objects.create(owner=other_user, list=others_list, title="Jane's task")
    response = client.get('/todos/tasks/')
    titles = [item['title'] for item in response.data['results']]
    assert "Jane's task" not in titles


def test_unauthenticated_user_cannot_access_tasks(api_client):
    response = api_client.get('/todos/tasks/')
    assert response.status_code == 401


# ---------- Update ----------

def test_user_can_mark_task_complete(authenticated_client, user_list):
    client, user = authenticated_client
    task = Task.objects.create(owner=user, list=user_list, title="Buy milk")
    response = client.patch(f'/todos/tasks/{task.id}/', {"is_completed": True})
    assert response.status_code == 200
    task.refresh_from_db()
    assert task.is_completed is True
    assert task.completed_at is not None


def test_marking_task_incomplete_clears_completed_at(authenticated_client, user_list):
    client, user = authenticated_client
    task = Task.objects.create(
        owner=user, list=user_list, title="Buy milk",
        is_completed=True, completed_at=timezone.now(),
    )
    response = client.patch(f'/todos/tasks/{task.id}/', {"is_completed": False})
    assert response.status_code == 200
    task.refresh_from_db()
    assert task.is_completed is False
    assert task.completed_at is None


def test_user_can_mark_task_important(authenticated_client, user_list):
    client, user = authenticated_client
    task = Task.objects.create(owner=user, list=user_list, title="Buy milk")
    response = client.patch(f'/todos/tasks/{task.id}/', {"is_important": True})
    assert response.status_code == 200
    task.refresh_from_db()
    assert task.is_important is True


def test_user_cannot_update_others_task(authenticated_client, other_user):
    client, user = authenticated_client
    others_list = List.objects.create(owner=other_user, title="Jane's List")
    others_task = Task.objects.create(owner=other_user, list=others_list, title="Jane's task")
    response = client.patch(f'/todos/tasks/{others_task.id}/', {"is_completed": True})
    assert response.status_code == 404  # should 404, not 403 — owner-scoped queryset hides it entirely


def test_user_cannot_move_task_to_others_list(authenticated_client, user_list, other_user):
    client, user = authenticated_client
    task = Task.objects.create(owner=user, list=user_list, title="Buy milk")
    others_list = List.objects.create(owner=other_user, title="Jane's List")
    response = client.patch(f'/todos/tasks/{task.id}/', {"list": str(others_list.id)})
    assert response.status_code == 400
    assert "list" in response.data


# ---------- Delete ----------

def test_user_can_delete_own_task(authenticated_client, user_list):
    client, user = authenticated_client
    task = Task.objects.create(owner=user, list=user_list, title="Buy milk")
    response = client.delete(f'/todos/tasks/{task.id}/')
    assert response.status_code == 204
    assert not Task.objects.filter(id=task.id).exists()


def test_user_cannot_delete_others_task(authenticated_client, other_user):
    client, user = authenticated_client
    others_list = List.objects.create(owner=other_user, title="Jane's List")
    others_task = Task.objects.create(owner=other_user, list=others_list, title="Jane's task")
    response = client.delete(f'/todos/tasks/{others_task.id}/')
    assert response.status_code == 404


# ---------- Filtering ----------

def test_filter_tasks_by_is_completed(authenticated_client, user_list):
    client, user = authenticated_client
    Task.objects.create(owner=user, list=user_list, title="Done task", is_completed=True)
    Task.objects.create(owner=user, list=user_list, title="Pending task", is_completed=False)

    response = client.get('/todos/tasks/?is_completed=true')
    titles = [item['title'] for item in response.data['results']]
    assert "Done task" in titles
    assert "Pending task" not in titles


def test_filter_tasks_by_list(authenticated_client, user_list):
    client, user = authenticated_client
    other_list = List.objects.create(owner=user, title="Work")
    Task.objects.create(owner=user, list=user_list, title="Grocery task")
    Task.objects.create(owner=user, list=other_list, title="Work task")

    response = client.get(f'/todos/tasks/?list={user_list.id}')
    titles = [item['title'] for item in response.data['results']]
    assert "Grocery task" in titles
    assert "Work task" not in titles


def test_search_tasks_by_title(authenticated_client, user_list):
    client, user = authenticated_client
    Task.objects.create(owner=user, list=user_list, title="Buy milk")
    Task.objects.create(owner=user, list=user_list, title="Call dentist")

    response = client.get('/todos/tasks/?search=milk')
    titles = [item['title'] for item in response.data['results']]
    assert "Buy milk" in titles
    assert "Call dentist" not in titles