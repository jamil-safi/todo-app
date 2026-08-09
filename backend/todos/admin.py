from django.contrib import admin
from .models import *

class TaskInline(admin.TabularInline):
    model = Task
    extra = 1
    fields = ('title', 'is_completed' , 'is_important' , 'due_date')


@admin.register(List)
class ListAdmin(admin.ModelAdmin):
    list_display = ('title' , 'owner' , 'display_order' , 'created_at')
    inlines = [TaskInline]

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title' , 'list' , 'owner' , 'is_completed' , 'is_important' , 'due_date')
    list_filter = ('is_completed' , 'is_important')
    search_fields = ('title' , 'description')

