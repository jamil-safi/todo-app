import django_filters
from .models import *

class TaskFilter(django_filters.FilterSet):
    due_date = django_filters.DateFilter(field_name = "due_date")
    due_date_after = django_filters.DateFilter(field_name = "due_date", lookup_expr="gte")
    due_date_before = django_filters.DateFilter(field_name = "due_date", lookup_expr="lte")

    class Meta:
        model = Task
        fields = {
            "is_completed" : ["exact"],
            "is_important" : ["exact"],
            "list" : ["exact"],
        }