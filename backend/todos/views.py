from django.shortcuts import render
from django.db.models import Count
from rest_framework import permissions
from rest_framework.viewsets import ModelViewSet
from rest_framework.exceptions import PermissionDenied
from . import models
from . import serializers
from .filters import TaskFilter

class OwnerQuerysetMixin:
    owner_field = "owner"
    
    def get_queryset(self):
        return super().get_queryset().filter(
            **{self.owner_field : self.request.user}
        )



class ListViewSet(OwnerQuerysetMixin , ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = models.List.objects.all()
    search_fields = ["title"]
    ordering_fields  = ["display_order" , "created_at" , "title"]
    ordering = ["display_order" , "created_at"]


    def get_queryset(self):
        return (
            super().get_queryset()
            .annotate(task_count = Count('tasks'))
        )
    
    def get_serializer_class(self):
        if self.action in ["create", "update" , "partial_update"]:
            return serializers.ListWriteSerializer
        return serializers.ListReadSerializer


    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.is_default:
            raise PermissionDenied("The default list cannot be deleted.")
        return super().destroy(request, *args, **kwargs)



class TaskViewSet(OwnerQuerysetMixin , ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    queryset = models.Task.objects.all()
    filterset_class = TaskFilter
    search_fields  = ["title" , "description"]
    ordering_fields = ["display_order" , "due_date" , "created_at"]
    ordering = ["display_order" , "created_at"]

    
    def get_queryset(self):
        return (
            super().get_queryset()
            .select_related("list")
        )
    
    def get_serializer_class(self):
        if self.action in ["create" , "update" , "partial_update"]:
            return serializers.TaskWriteSerializer
        return serializers.TaskReadSerializer
    
    
