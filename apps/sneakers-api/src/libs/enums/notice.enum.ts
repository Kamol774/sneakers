import { registerEnumType } from '@nestjs/graphql';

export enum NoticeCategory {
	FAQ = 'FAQ',
	TERMS = 'TERMS',
	INQUIRY = 'INQUIRY',
}
registerEnumType(NoticeCategory, {
	name: 'NoticeCategory',
});

export enum NoticeStatus {
	HOLD = 'HOLD',
	ACTIVE = 'ACTIVE',
	DELETE = 'DELETE',
}
registerEnumType(NoticeStatus, {
	name: 'NoticeStatus',
});

export enum NoticeType {
	PROMOTION = 'Promotion',
	NEW_ARRIVAL = 'New_Arrival',
	MAINTENANCE = 'Maintenance',
	SAFETY = 'Safety',
	WEBSITE_UPDATE = 'Website_Update',
	LEGAL_POLICY = 'Legal_Policy',
	GENERAL_ANNOUNCEMENT = 'General_Announcement',
}
registerEnumType(NoticeType, {
	name: 'NoticeType',
});
