from django.db import models
from django.conf import settings
from uuid import uuid4
from django.utils import timezone

User = settings.AUTH_USER_MODEL


class List(models.Model):
    
    id = models.UUIDField(
        primary_key = True,
        default = uuid4,
        editable = False
    )
    owner = models.ForeignKey(
        User, 
        on_delete = models.CASCADE,
        related_name = "lists"
    )
    
    title = models.CharField(max_length=255)
    display_order = models.PositiveIntegerField(default = 0)
    created_at = models.DateTimeField(auto_now_add=True)
    is_default = models.BooleanField(default=False)
    
    class Meta:
        ordering = [
            'display_order',
            'created_at',
        ]
                
    def __str__(self):
        return self.title
    


class Task(models.Model):
    id = models.UUIDField(
        primary_key = True, 
        default = uuid4,
        editable = False
    )
    owner = models.ForeignKey(
        User, 
        on_delete = models.CASCADE, 
        related_name = "tasks"
    )
    list = models.ForeignKey(
        List, 
        on_delete = models.CASCADE,
        related_name='tasks'
    )

    title = models.CharField(max_length = 255)
    description = models.TextField(null = True, blank = True)
    due_date = models.DateField(null = True, blank = True)
    is_important = models.BooleanField(default = False)
    is_completed = models.BooleanField(default = False)
    reminder_at = models.DateTimeField(null = True, blank = True)
    display_order = models.PositiveIntegerField(default = 0)
    created_at = models.DateTimeField(auto_now_add = True)
    updated_at = models.DateTimeField(auto_now = True)
    completed_at = models.DateTimeField(null = True, blank = True)
    
    class Meta:
        ordering = ['display_order' , 'created_at']

        indexes = [
            models.Index(fields = ["owner"]),
            models.Index(fields = ["list", "is_completed"]),
            models.Index(fields = ["is_important"]),
            models.Index(fields = ["due_date"]),
        ]
    
    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if self.is_completed and self.completed_at is None:
            self.completed_at = timezone.now()
        elif not self.is_completed:
            self.completed_at = None
        super().save(*args, **kwargs)

