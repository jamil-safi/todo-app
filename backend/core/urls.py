from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import *

urlpatterns = [
    path("signup/" , SignupView.as_view() , name="auth-signup"),
    path("login/" , LoginView.as_view() , name="auth-login"),
    path("logout/" , LogoutView.as_view() , name="auth-logout"),
    path('me/', ProfileView.as_view(), name='auth-profile'),
    path('password-reset/request/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
]