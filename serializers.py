from rest_framework import serializers
from .models import Agreement
from accounts.models import Vendor, Department

class AgreementSerializer(serializers.ModelSerializer):
    agreement_type_name = serializers.CharField(source='agreement_type.name', read_only=True)
    party_name_display = serializers.CharField(source='party_name.name', read_only=True)
    assigned_users = serializers.SerializerMethodField()
    original_filename = serializers.CharField(read_only=True)

    def get_assigned_users(self, obj):
        return [user.full_name for user in obj.assigned_users.all()]
    
    class Meta:
        model = Agreement
        fields = [
            'id', 'title', 'agreement_reference', 'agreement_type', 'agreement_type_name',
            'status', 'start_date', 'expiry_date', 'reminder_time', 
            'party_name', 'party_name_display', 'attachment', 'original_filename','created_at', 'updated_at',
            'agreement_id', 'assigned_users', 'department'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'agreement_id', 'assigned_users', 'department']

    def create(self, validated_data):
        validated_data['creator'] = self.context['request'].user
        # Set department from agreement_type if not set
        if 'agreement_type' in validated_data and 'department' not in validated_data:
            validated_data['department'] = validated_data['agreement_type']
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Set department from agreement_type if not set
        if 'agreement_type' in validated_data and 'department' not in validated_data:
            validated_data['department'] = validated_data['agreement_type']
        return super().update(instance, validated_data)
