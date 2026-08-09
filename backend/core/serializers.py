from django.contrib.auth import get_user_model, authenticate
from django.core.exceptions import ValidationError as DjangoValidationError
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from rest_framework import serializers
from .validators import custom_password_validators


User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id" , "email" , "username" , "first_name" , "last_name"]


class SignupSerializer(serializers.ModelSerializer):
    password         = serializers.CharField(write_only=True, min_length=8 , validators = [custom_password_validators])
    confirm_password = serializers.CharField(write_only=True)
    first_name       = serializers.CharField(required=True, max_length=255)
    last_name        = serializers.CharField(required=True, max_length=255)

    class Meta:
        model  = User
        fields = [
            "id",
            "username", 
            "email",
            "first_name", 
            "last_name",
            "password", 
            "confirm_password",
        ]
        read_only_fields = ["id"]


    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_first_name(self, value):
        return value.strip()

    def validate_last_name(self, value):
        return value.strip()

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("confirm_password")
        return User.objects.create_user(**validated_data)
    
  


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only = True)
    
    
    def validate(self, attrs):
        user = authenticate(
            request = self.context.get("request"),
            username = attrs["username"],
            password = attrs["password"]
        )

        if user is None:
            raise serializers.ValidationError("Invalid username/email or password.")
        if not user.is_active:
            raise serializers.ValidationError("This account has been deactivated.")
        
        attrs["user"] = user
        return attrs
    


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only = True)
    new_password = serializers.CharField(
        write_only = True, 
        validators = [custom_password_validators]
    )
    confirm_password = serializers.CharField(write_only = True)
    
    def validate_current_password(self , value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError({"current_password" :  "Current passowrd is incorrect"})
        return value
    
    def validate(self , attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password" : "Password did not match"})
        if attrs["new_password"] == attrs["current_password"]:
            raise serializers.ValidationError("New password can not be similar to previous password.")
        return attrs
    
    def save(self):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields = ["password"])
        return user



class ProfileUpdateSerializer(serializers.ModelSerializer):
    current_password = serializers.CharField(write_only=True, required=False)
    new_password = serializers.CharField(write_only=True, required=False)
    confirm_new_password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name",
            "current_password", "new_password", "confirm_new_password",
        ]
        read_only_fields = ["id", "username", "email"]

    def validate(self, attrs):
        user = self.instance

        # Determine if any actual profile field is being changed
        wants_to_change_name = (
            ("first_name" in attrs and attrs["first_name"] != user.first_name)
            or ("last_name" in attrs and attrs["last_name"] != user.last_name)
        )
        wants_to_change_password = "new_password" in attrs or "confirm_new_password" in attrs

        if wants_to_change_name or wants_to_change_password:
            current_password = attrs.get("current_password")
            if not current_password:
                raise serializers.ValidationError(
                    {"current_password": "Current password is required to make changes."}
                )
            if not user.check_password(current_password):
                raise serializers.ValidationError(
                    {"current_password": "Current password is incorrect."}
                )

        if wants_to_change_password:
            new_password = attrs.get("new_password")
            confirm_new_password = attrs.get("confirm_new_password")

            if not new_password or not confirm_new_password:
                raise serializers.ValidationError(
                    {"new_password": "Both new_password and confirm_new_password are required."}
                )
            if new_password != confirm_new_password:
                raise serializers.ValidationError(
                    {"confirm_new_password": "Passwords do not match."}
                )

            try:
                custom_password_validators(new_password)
            except DjangoValidationError as e:
                raise serializers.ValidationError({"new_password": e.messages})

        return attrs

    def update(self, instance, validated_data):
        validated_data.pop("current_password", None)
        new_password = validated_data.pop("new_password", None)
        validated_data.pop("confirm_new_password", None)

        instance.first_name = validated_data.get("first_name", instance.first_name)
        instance.last_name = validated_data.get("last_name", instance.last_name)

        if new_password:
            instance.set_password(new_password)

        instance.save()
        return instance

    def to_representation(self, instance):
            return UserSerializer(instance , context = self.context).data



class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)
    confirm_new_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        try:
            user_id = force_str(urlsafe_base64_decode(attrs["uid"]))
            user = User.objects.get(pk=user_id)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            raise serializers.ValidationError({"token": "Invalid or expired link."})

        if not default_token_generator.check_token(user, attrs["token"]):
            raise serializers.ValidationError({"token": "Invalid or expired link."})

        if attrs["new_password"] != attrs["confirm_new_password"]:
            raise serializers.ValidationError({"confirm_new_password": "Passwords do not match."})

        try:
            custom_password_validators(attrs["new_password"])
        except DjangoValidationError as e:
            raise serializers.ValidationError({"new_password": e.messages})

        attrs["user"] = user
        return attrs

    def save(self):
        user = self.validated_data["user"]
        user.set_password(self.validated_data["new_password"])
        user.save()
        return user