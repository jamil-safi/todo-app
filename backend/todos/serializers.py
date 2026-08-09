from django.conf import settings
from django.utils import timezone
from rest_framework import serializers
from .models import *


class TaskReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = [
            "id", 
            "list", 
            "title", 
            "description", 
            "due_date", 
            "reminder_at",
            "is_important",
            "is_completed", 
            "display_order", 
            "updated_at",
            "created_at",
            "completed_at",
        ]
        
        read_only_fields = [
            "id", 
            "updated_at",  
            "created_at",
        ]


class TaskWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = [
            "id", 
            "list",
            "title", 
            "description", 
            "due_date", 
            "reminder_at", 
            "is_important", 
            "is_completed", 
            "display_order",
        ]
        
        read_only_fields = [
            "id" , 
        ]
        
    def validate_list(self , value):
        if value.owner != self.context["request"].user:
            raise serializers.ValidationError("Invalid List")
        return value
    
    def validate_due_date(self , value):
        if value and value < timezone.now().date():
            raise serializers.ValidationError("Due date cannot be in the past.")
        return value

    def validate_reminder_at(self , value):
        if value and value < timezone.now():
            raise serializers.ValidationError("Reminder cannot be set to the past.")
        return value
        
    def create(self , validated_data):
        validated_data["owner"] = self.context["request"].user
        return super().create(validated_data)
    
    
    def to_representation(self, instance):
        return TaskReadSerializer(instance , context = self.context).data
        
        
        
class ListReadSerializer(serializers.ModelSerializer):
    task_count = serializers.SerializerMethodField()
    class Meta:
        model = List
        fields = [
            "id", 
            "title", 
            "display_order", 
            "created_at", 
            "task_count", 
            "is_default",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "is_default",
            'task_count',
        ]

    def get_task_count(self , obj) -> int:
        return getattr(obj, "task_count", None) if hasattr(obj, "task_count") else obj.tasks.count()
   
class ListWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = List

        fields = [
            "id", 
            "title", 
            "display_order",
        ]

        read_only_fields = [
            "id",
        ]

    def validate(self, attrs):
        instance = self.instance 
        if instance and instance.is_default:
            if "title" in attrs and attrs["title"] != instance.title:
                raise serializers.ValidationError(
                    {"title": "The default list's title cannot be changed."}
                )
            if "display_order" in attrs and attrs["display_order"] != instance.display_order:
                raise serializers.ValidationError(
                    {"display_order": "The default list's order cannot be changed."}
                )

        return attrs

    def create(self , validated_data):
        validated_data["owner"] = self.context["request"].user
        return super().create(validated_data)
    
    def to_representation(self, instance):
        return ListReadSerializer(instance , context = self.context).data
    