from django.utils.deprecation import MiddlewareMixin
from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
from django.conf import settings


class JWTAutoRefreshMiddleware(MiddlewareMixin):
    def process_request(self, request):
        access_token = request.COOKIES.get("access_token")
        refresh_token = request.COOKIES.get("refresh_token")

        # no tokens at all, nothing to do — request proceeds unauthenticated
        if not access_token and not refresh_token:
            return

        # Try validating the current access token
        if access_token:
            try:
                AccessToken(access_token)
                return  # still valid, nothing to refresh
            except TokenError:
                pass    # expired or invalid, fall through to refresh attempt

        if refresh_token:
            try:
                # Explicitly check if this token has been blacklisted
                refresh = RefreshToken(refresh_token)
                jti = refresh.get("jti")
                if BlacklistedToken.objects.filter(token__jti=jti).exists():
                    return 

                new_access_token = str(refresh.access_token)

                # Overwrite the incoming cookie value so downstream auth (CookieJWTAuthentication) uses the new token
                request.COOKIES["access_token"] = new_access_token
                request.META["HTTP_COOKIE"] = request.META.get("HTTP_COOKIE", "")
                request._new_access_token = new_access_token

            except TokenError:
                pass    # refresh token also invalid/expired — request proceeds unauthenticated


    def process_response(self, request, response):
        new_token = getattr(request, "_new_access_token", None)
        if new_token:
            response.set_cookie(
                key = "access_token",
                value = new_token,
                httponly = True,
                secure = settings.COOKIE_SECURE,
                samesite = settings.COOKIE_SAMESITE,
                max_age = 60 * 30,
            )
        return response
