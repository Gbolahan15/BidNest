from django.core.management.base import BaseCommand
from users.models import User, LandlordProfile


class Command(BaseCommand):
    help = 'Create admin superuser'

    def handle(self, *args, **kwargs):
        if not User.objects.filter(email='admin@bidnest.com').exists():
            user = User.objects.create_superuser(
                email='admin@bidnest.com',
                password='Admin1234!',
                full_name='BidNest Admin',
                role='landlord'
            )
            LandlordProfile.objects.create(user=user)
            self.stdout.write(self.style.SUCCESS('Admin created successfully!'))
        else:
            self.stdout.write('Admin already exists.')