import { ObjectLiteral } from 'typeorm';
import { EntityOptions } from 'typeorm/decorator/options/EntityOptions';
import { PrimaryGeneratedColumnType } from 'typeorm/driver/types/ColumnTypes';
export declare enum AuditingAction {
    Create = "Create",
    Update = "Update",
    Delete = "Delete"
}
export interface AuditingEntityDefaultColumns {
    readonly _seq: number;
    readonly _action: AuditingAction;
    readonly _modifiedAt: Date;
}
/**
 * @deprecated Use AuditingEntityDefaultColumns instead of IAuditingEntity.
 */
export interface IAuditingEntity extends AuditingEntityDefaultColumns {
}
export interface AuditingEntityOptions extends EntityOptions {
    /**
     * The type of *_seq* column can be specified.
     */
    seqType?: PrimaryGeneratedColumnType;
}
export declare abstract class AbstractAuditingBaseEntity implements AuditingEntityDefaultColumns {
    readonly _seq: number;
    readonly _action: AuditingAction;
    readonly _modifiedAt: Date;
}
export declare function AuditingEntity<T extends ObjectLiteral>(entityType: ObjectLiteral, options?: AuditingEntityOptions): (target: Function) => void;
