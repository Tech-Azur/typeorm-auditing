"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var AuditingSubscriber_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditingSubscriber = void 0;
const typeorm_1 = require("typeorm");
const auditing_entity_decorator_1 = require("./decorator/auditing-entity.decorator");
const MetadataUtils_1 = require("typeorm/metadata-builder/MetadataUtils");
let AuditingSubscriber = AuditingSubscriber_1 = class AuditingSubscriber {
    static Subscribe(origin, target) {
        AuditingSubscriber_1.subscribers.push({ origin, target });
    }
    saveHistory(entityType, manager, entity, action) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const target = (_a = AuditingSubscriber_1.subscribers.find((item) => item.origin === entityType)) === null || _a === void 0 ? void 0 : _a.target;
            if (!target)
                return;
            // If target(audit entity) is a class that inherits from BaseEntity, instantiate it.
            // Without this process, listeners such as @BeforeInsert do not work.
            if (MetadataUtils_1.MetadataUtils.getInheritanceTree(target).includes(typeorm_1.BaseEntity))
                yield manager.save(target.create(Object.assign(Object.assign({}, entity), { _action: action })));
            else {
                const replica = new target();
                Object.assign(replica, Object.assign(Object.assign({}, entity), { _action: action }));
                yield manager.save(target, replica);
            }
        });
    }
    afterInsert(event) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.saveHistory(event.metadata.target, event.manager, event.entity, auditing_entity_decorator_1.AuditingAction.Create);
        });
    }
    afterUpdate(event) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.saveHistory(event.metadata.target, event.manager, event.entity, auditing_entity_decorator_1.AuditingAction.Update);
        });
    }
    afterRemove(event) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.saveHistory(event.metadata.target, event.manager, event.databaseEntity, auditing_entity_decorator_1.AuditingAction.Delete);
        });
    }
    afterSoftRemove(event) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.afterRemove(event);
        });
    }
};
AuditingSubscriber.subscribers = [];
AuditingSubscriber = AuditingSubscriber_1 = __decorate([
    (0, typeorm_1.EventSubscriber)()
], AuditingSubscriber);
exports.AuditingSubscriber = AuditingSubscriber;
