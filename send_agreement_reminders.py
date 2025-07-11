import logging
from django.core.management.base import BaseCommand
from django.utils import timezone
from agreements.models import Agreement
from agreements.utils.email_utils import send_agreement_reminder
from django.db.models import Q

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Sends agreement reminders to assigned users'

    def handle(self, *args, **options):
        today = timezone.now().date()
        agreements = Agreement.objects.filter(
            Q(reminder_time=today) | Q(reminder_time__lt=today, expiry_date__gte=today),
            status='ongoing'
        ).prefetch_related('assigned_users')
        
        if not agreements:
            logger.info('No reminders to send today')
            self.stdout.write(self.style.SUCCESS('No reminders to send today'))
            return
            
        success_count = 0
        failure_count = 0
        
        for agreement in agreements:
            # Skip if reminder date is in future (for the Q(reminder_time__lt=today) case)
            if agreement.reminder_time > today:
                continue
                
            for user in agreement.assigned_users.all():
                try:
                    result = send_agreement_reminder(agreement, user)
                    if result:
                        success_count += 1
                        logger.info(f'Sent reminder for {agreement.title} to {user.email}')
                        self.stdout.write(
                            self.style.SUCCESS(f'Sent reminder for {agreement.title} to {user.email}')
                        )
                    else:
                        failure_count += 1
                        logger.warning(f'Failed to send reminder for {agreement.title} to {user.email}')
                except Exception as e:
                    failure_count += 1
                    logger.error(f'Error sending to {user.email}: {str(e)}')
                    self.stdout.write(
                        self.style.ERROR(f'Error sending to {user.email}: {str(e)}')
                    )
        
        total_count = success_count + failure_count
        if total_count > 0:
            summary = f"Sent {success_count}/{total_count} agreement reminders ({failure_count} failures)"
            logger.info(summary)
            self.stdout.write(self.style.SUCCESS(summary))