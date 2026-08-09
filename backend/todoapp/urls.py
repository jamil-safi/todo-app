# todoproject/urls.py
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from rest_framework.permissions import AllowAny

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('core.urls')),
    path('api/todos/', include('todos.urls')),

    path('api/schema/', SpectacularAPIView.as_view(
        authentication_classes=[],
        permission_classes=[AllowAny],
    ), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(
        url_name='schema',
        authentication_classes=[],
        permission_classes=[AllowAny],
    ), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(
        url_name='schema',
        authentication_classes=[],
        permission_classes=[AllowAny],
    ), name='redoc'),
]