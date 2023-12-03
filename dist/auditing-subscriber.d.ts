import { EntitySubscriberInterface, InsertEvent, RemoveEvent, SoftRemoveEvent, UpdateEvent } from 'typeorm';
export declare class AuditingSubscriber implements EntitySubscriberInterface {
    private static subscribers;
    static Subscribe(origin: Function, target: Function): void;
    private saveHistory;
    afterInsert(event: InsertEvent<any>): Promise<any>;
    afterUpdate(event: UpdateEvent<any>): Promise<any>;
    afterRemove(event: RemoveEvent<any>): Promise<any>;
    afterSoftRemove(event: SoftRemoveEvent<any>): Promise<any>;
}
