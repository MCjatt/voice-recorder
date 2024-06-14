# accounts/models.py
from django.db import models
from django.contrib.auth.models import User

class Audio(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    url = models.URLField(max_length=200)

    def __str__(self):
        return self.name
