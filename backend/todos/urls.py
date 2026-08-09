from django.urls import path
from rest_framework_nested import routers
from .views import *


router = routers.DefaultRouter()
router.register("lists" , ListViewSet, basename="lists")
router.register("tasks" , TaskViewSet, basename="tasks")

urlpatterns = router.urls