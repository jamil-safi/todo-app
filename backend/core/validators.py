from django.core.exceptions import ValidationError

class MinLengthValidator:
    def __init__(self, min_length=8):
        self.min_length = min_length

    def validate(self, password):
        if len(password) < self.min_length:
            raise ValidationError(
                f"Password must be at least {self.min_length} characters long.",
                code='password_too_short',
            )

    def get_help_text(self):
        return f"Your password must be at least {self.min_length} characters long."


class MaxLengthValidator:
    def __init__(self, max_length=64):
        self.max_length = max_length

    def validate(self, password):
        if len(password) > self.max_length:
            raise ValidationError(
                f"Password must not exceed {self.max_length} characters.",
                code='password_too_long',
            )

    def get_help_text(self):
        return f"Your password must not exceed {self.max_length} characters."


class UppercaseValidator:
    def validate(self, password):
        if not any(char.isupper() for char in password):
            raise ValidationError(
                "Password must contain at least one uppercase letter.",
                code='password_no_upper_letter',
            )

    def get_help_text(self):
        return "Your password must contain at least one uppercase letter."


class LowercaseValidator:
    def validate(self, password):
        if not any(char.islower() for char in password):
            raise ValidationError(
                "Password must contain at least one lowercase letter.",
                code='password_no_lower_letter',
            )

    def get_help_text(self):
        return "Your password must contain at least one lowercase letter."
    

class DigitValidator:
    def validate(self, password):
        if not any(char.isdigit() for char in password):
            raise ValidationError(
                "Password must contain at least one digit.",
                code='password_no_digit',
            )

    def get_help_text(self):
        return "Your password must contain at least one number."


class SpecialCharacterValidator:
    SPECIAL_CHARS = r'!@#$%^&*(),.?":{}|<>'

    def validate(self, password):
        if not any(char in self.SPECIAL_CHARS for char in password):
            raise ValidationError(
                "Password must contain at least one special character.",
                code='password_no_special_char',
            )

    def get_help_text(self):
        return f"Your password must contain at least one special character ({self.SPECIAL_CHARS})."


class NoWhitespaceValidator:
    def validate(self, password):
        if any(char.isspace() for char in password):
            raise ValidationError(
                "Password must not contain spaces.",
                code='password_has_whitespace',
            )

    def get_help_text(self):
        return "Your password must not contain spaces."


# class CommonPasswordValidator:
#     COMMON_PASSWORDS = {
#         'password', 'password123', '12345678', 'qwerty123',
#         'letmein', 'admin123', 'welcome123', 'iloveyou',
#     }

#     def validate(self, password):
#         if password.lower() in self.COMMON_PASSWORDS:
#             raise ValidationError(
#                 "This password is too common. Please choose a stronger password.",
#                 code='password_too_common',
#             )

#     def get_help_text(self):
#         return "Your password must not be a commonly used password."


def custom_password_validators(password):
    validators = [
        MinLengthValidator(min_length=8),
        MaxLengthValidator(max_length=64),
        UppercaseValidator(),
        LowercaseValidator(),
        DigitValidator(),
        SpecialCharacterValidator(),
        NoWhitespaceValidator(),
    ]

    errors = []
    for validator in validators:
        try:
            validator.validate(password)
        except ValidationError as e:
            errors.extend(e.messages)

    if errors:
        raise ValidationError(errors)