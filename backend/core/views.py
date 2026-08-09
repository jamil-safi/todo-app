from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from drf_spectacular.utils import extend_schema
from rest_framework.views import APIView
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from .serializers import *
from .utils import get_tokens_for_user
from .throttles import *


class SignupView(APIView):
    serializer_class = SignupSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [SignupRateThrottle]
    authentication_classes = []

    def get_serializer(self, *args, **kwargs):
        return self.serializer_class(*args, **kwargs)

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            {
                "user": UserSerializer(user).data,
                "tokens": get_tokens_for_user(user),
            },
            status=201,
        )
        

class LoginView(APIView):
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [LoginRateThrottle]
    authentication_classes = []
    
    def get_serializer(self, *args, **kwargs):
        return self.serializer_class(*args, **kwargs)

    def post(self, request):
        serializer = self.get_serializer(
            data=request.data, 
            context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        tokens = get_tokens_for_user(user)
        response = Response(
            {
                "user" : UserSerializer(user).data,
            },
            status=200
        )

        response.set_cookie(
            key = "access_token",
            value = tokens["access"],
            httponly = True,
            secure = settings.COOKIE_SECURE,
            samesite = "Lax",              
            max_age = 60 * 30,
            path="/", 
        )

        response.set_cookie(
            key = "refresh_token",
            value = tokens["refresh"],
            httponly = True,
            secure = settings.COOKIE_SECURE,
            samesite = "Lax",
            max_age = 60 * 60 * 24 * 7,
            path="/", 
        )

        return response
        

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]


    @extend_schema(
        request=None,
        responses={200: dict},
        summary="Logout",
        description="Blacklists the refresh token and clears auth cookies.",
    )
    def post(self, request):
        refresh_token = request.COOKIES.get("refresh_token")
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass

        response = Response(
            {
                "message" : "Logged out successfully"
            },
            status = 200,
        )
        response.delete_cookie("access_token",  path="/")
        response.delete_cookie("refresh_token",  path="/")
        return response


class ProfileView(RetrieveUpdateAPIView):
    serializer_class = ProfileUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def perform_update(self, serializer):
        password_changed = bool(serializer.validated_data.get("new_password"))
        serializer.save()

        if password_changed:
            # blacklist all existing refresh tokens — force re-login everywhere except here
            tokens = OutstandingToken.objects.filter(user=self.request.user)
            for token in tokens:
                BlacklistedToken.objects.get_or_create(token=token)
    
    

class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = PasswordResetRequestSerializer
    throttle_classes = [PasswordResetRateThrottle]

    def get_serializer(self, *args, **kwargs):
        return self.serializer_class(*args, **kwargs)
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        user = User.objects.filter(email__iexact=email).first()

        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_link = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
            # print(uid)
            # print(token)

            send_mail(
                subject="Reset your password",
                message=f"Click the link to reset your password: {reset_link}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
            )

        return Response(
            {"message": "If an account with that email exists, a password reset link has been sent."},
            status=status.HTTP_200_OK,
        )

      

class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = PasswordResetConfirmSerializer
    throttle_classes = [PasswordResetRateThrottle]

    def get_serializer(self, *args, **kwargs):
        return self.serializer_class(*args, **kwargs)

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        tokens = OutstandingToken.objects.filter(user=user)
        for t in tokens:
            BlacklistedToken.objects.get_or_create(token=t)

        return Response(
            {"message": "Password has been reset successfully."}, 
            status=status.HTTP_200_OK
        )