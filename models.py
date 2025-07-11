from django.db import models
from django.conf import settings
from datetime import datetime, timedelta
from accounts.models import Department, Vendor
from django.core.exceptions import ValidationError
import os
import uuid

def agreement_file_path(instance, filename):
    """Generate file path for agreement attachments"""
    ext = os.path.splitext(filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    return os.path.join('agreements', str(instance.agreement_type.id), filename)

class Agreement(models.Model):
    AGREEMENT_STATUS = (
        ('ongoing', 'Ongoing'),
        ('expired', 'Expired'),
        ('draft', 'Draft'),
        ('terminated', 'Terminated'),
    )
    
    title = models.CharField(max_length=200)
    agreement_type = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name='agreements',
        verbose_name='Department'
    )
    status = models.CharField(
        max_length=15, 
        choices=AGREEMENT_STATUS, 
        default='draft'
    )
    start_date = models.DateField()
    expiry_date = models.DateField()
    party_name = models.ForeignKey(
        Vendor,
        on_delete=models.CASCADE,
        related_name='agreements',
        verbose_name='Vendor'
    )
    reminder_time = models.DateField(
        help_text="Date when reminders should be sent"
    )
    assigned_users = models.ManyToManyField(
        settings.AUTH_USER_MODEL, 
        related_name='assigned_agreements',
        blank=True
    )
    attachment = models.FileField(
        upload_to=agreement_file_path,
        max_length=255,
        blank=True,
        null=True
    )
    original_filename = models.CharField(max_length=255, blank=True, null=True)  # <-- Add this
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_agreements'
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='department_agreements'
    )
    agreement_id = models.CharField(
        max_length=20, 
        unique=True, 
        editable=False, 
        blank=True
    )
    agreement_reference = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        #unique=True  # Remove if you need to allow duplicates
    )

    def clean(self):
        super().clean()
        
        # Validate date relationships
        if self.start_date and self.expiry_date:
            if self.expiry_date <= self.start_date:
                raise ValidationError(
                    {'expiry_date': 'Expiry date must be after start date.'}
                )
            
            if not self.reminder_time:
                self.reminder_time = self.expiry_date - timedelta(days=180)
            
            if self.reminder_time <= self.start_date:
                raise ValidationError(
                    {'reminder_time': 'Reminder must be after start date.'}
                )
                
            if self.reminder_time >= self.expiry_date:
                raise ValidationError(
                    {'reminder_time': 'Reminder must be before expiry date.'}
                )

    def save(self, *args, **kwargs):
        # Set department from agreement_type if not set
        if not self.department and self.agreement_type:
            self.department = self.agreement_type
            
        # Auto-generate agreement_id if new record
        if not self.pk:
            year = datetime.now().year
            count = Agreement.objects.filter(
                created_at__year=year
            ).count() + 1
            self.agreement_id = f"A_{year}_{count:04d}"
            
        # Set default reminder if not set
        if not self.reminder_time and self.expiry_date:
            self.reminder_time = self.expiry_date - timedelta(days=180)
            
        # If a new file is uploaded, set the original filename
        if self.attachment and hasattr(self.attachment, 'file'):
            # Only set if the file is new or changed
            if not self.pk or not Agreement.objects.filter(pk=self.pk, attachment=self.attachment.name).exists():
                # Use the uploaded file's original name
                self.original_filename = self.attachment.file.name
            
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        """Delete associated files when agreement is deleted"""
        if self.attachment:
            self.attachment.delete(save=False)
        super().delete(*args, **kwargs)

    def __str__(self):
        return f"{self.agreement_id} - {self.title}"

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Agreement'
        verbose_name_plural = 'Agreements'

    def send_notification(self, user):
        """Send reminder email for this agreement"""
        from .utils.email_utils import send_agreement_reminder
        return send_agreement_reminder(self, user)

    def send_reminder(self, recipient):
        """Send reminder email for this agreement"""
        from django.core.mail import send_mail
        from django.conf import settings
        
        subject = f"Reminder: {self.title} (Expires: {self.expiry_date})"
        message = f"""
        Agreement Reminder:
        Title: {self.title}
        Reference: {self.agreement_reference}
        Expiry Date: {self.expiry_date}
        """
        
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient.email],
            fail_silently=False,
        )
        return True


# Add this method to your existing Agreement model
def get_users_to_notify(self):
    """Get all users who should receive notifications for this agreement"""
    return self.assigned_users.all()

def send_notification(self, action):
    """Send notification about agreement action to all assigned users"""
    from agreements.utils.email_utils import send_agreement_notification
    recipients = list(self.get_users_to_notify().values_list('email', flat=True))
    if recipients:
        send_agreement_notification(self, action, recipients)