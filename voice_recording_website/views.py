# voice_recording_website/views.py

from django.shortcuts import render
from django.conf import settings
from django.contrib.auth.decorators import login_required

@login_required
def home(request):
    return render(request, 'home.html', {'username': request.user.username})

def firebase_test(request):
    return render(request, 'firebase_test.html')