"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditingEntity = exports.AbstractAuditingBaseEntity = exports.AuditingAction = void 0;
const typeorm_1 = require("typeorm");
const MetadataUtils_1 = require("typeorm/metadata-builder/MetadataUtils");
const auditing_subscriber_1 = require("../auditing-subscriber");
var AuditingAction;
(function (AuditingAction) {
    AuditingAction["Create"] = "Create";
    AuditingAction["Update"] = "Update";
    AuditingAction["Delete"] = "Delete";
})(AuditingAction = exports.AuditingAction || (exports.AuditingAction = {}));
class AbstractAuditingBaseEntity {
}
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: 'bigint' }),
    __metadata("design:type", Number)
], AbstractAuditingBaseEntity.prototype, "_seq", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar', { length: 20 }),
    __metadata("design:type", String)
], AbstractAuditingBaseEntity.prototype, "_action", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AbstractAuditingBaseEntity.prototype, "_modifiedAt", void 0);
exports.AbstractAuditingBaseEntity = AbstractAuditingBaseEntity;
function AuditingEntity(entityType, options) {
    return (target) => {
        options = options || {};
        const { seqType } = options, entityOptions = __rest(options, ["seqType"]);
        const metadata = (0, typeorm_1.getMetadataArgsStorage)();
        const origin = metadata.tables.find((table) => table.target === entityType);
        if (!origin)
            throw new Error('AuditingEntity: Cannot found origin entity from TypeORM metadata.');
        if (origin.type !== 'regular')
            throw new Error('AuditingEntity: Origin entity must be a regular entity type.');
        //Break inheritance. Avoid inheritance of index and event definitions
        Object.setPrototypeOf(target, AbstractAuditingBaseEntity);
        //create table
        metadata.tables.push({
            target,
            name: entityOptions.name,
            type: 'regular',
            orderBy: entityOptions.orderBy || origin.orderBy,
            engine: entityOptions.engine || origin.engine,
            database: entityOptions.database || origin.database,
            schema: entityOptions.schema || origin.schema,
            synchronize: entityOptions.synchronize || origin.synchronize,
            withoutRowid: entityOptions.withoutRowid,
        });
        const originInheritanceTree = MetadataUtils_1.MetadataUtils.getInheritanceTree(origin.target);
        const pkList = [];
        //import columns of origin table
        metadata.columns
            .filter((column) => originInheritanceTree.includes(column.target))
            .forEach((originColumn) => {
            let { type, array } = originColumn.options || {};
            const _a = ((_a) => {
                var { 
                // except
                type, array, nullable, generated, generatedType, generatedIdentity, asExpression, foreignKeyConstraintName, primaryKeyConstraintName, onUpdate, unique } = _a, 
                //
                rest = __rest(_a, ["type", "array", "nullable", "generated", "generatedType", "generatedIdentity", "asExpression", "foreignKeyConstraintName", "primaryKeyConstraintName", "onUpdate", "unique"]);
                return (Object.assign({}, rest));
            })(originColumn.options), { primary, name } = _a, options = __rest(_a, ["primary", "name"]);
            if (primary)
                pkList.push(originColumn.propertyName);
            if (!type) {
                if (['createDate', 'updateDate', 'deleteDate'].includes(originColumn.mode))
                    type = Date;
                else if (originColumn.mode === 'virtual')
                    type = String;
            }
            if (!array && originColumn.mode === 'array')
                array = true;
            metadata.columns.push({
                target,
                propertyName: originColumn.propertyName,
                mode: originColumn.mode === 'array' ? 'array' : 'regular',
                options: Object.assign({ nullable: true, name, type, array }, options),
            });
        });
        //generate index for origin PKs
        if (pkList.length > 0)
            metadata.indices.push({
                target,
                columns: pkList,
            });
        //relations
        metadata.relations
            .filter((rel) => originInheritanceTree.includes(rel.target) && rel.relationType !== 'many-to-many')
            .forEach((rel) => {
            metadata.relations.push(Object.assign(Object.assign({}, rel), { target, options: Object.assign(Object.assign({}, rel.options), { onUpdate: undefined, onDelete: undefined, cascade: undefined, createForeignKeyConstraints: false, orphanedRowAction: undefined }) }));
        });
        //join columns
        metadata.joinColumns
            .filter((joinColumn) => originInheritanceTree.includes(joinColumn.target))
            .forEach((joinColumn) => {
            metadata.joinColumns.push(Object.assign(Object.assign({}, joinColumn), { target }));
        });
        //_seq
        metadata.columns.push({
            target,
            propertyName: '_seq',
            mode: 'regular',
            options: { type: seqType || 'bigint', primary: true },
        });
        metadata.generations.push({ target, propertyName: '_seq', strategy: 'increment' });
        //_action
        metadata.columns.push({
            target,
            propertyName: '_action',
            mode: 'regular',
            options: { type: 'varchar', length: 20 },
        });
        //_modifiedAt
        metadata.columns.push({ target, propertyName: '_modifiedAt', mode: 'createDate', options: {} });
        //entityListeners
        auditing_subscriber_1.AuditingSubscriber.Subscribe(origin.target, target);
    };
}
exports.AuditingEntity = AuditingEntity;
