import React from "react";
import Select from "@/components/elements/Select";
import UserSearchInput from "./UserSearchInput";
import { Filter } from "./api/getFilteredServers";

export type SortField = "name" | "created_at" | "updated_at";
export type SortDir = "asc" | "desc";

interface Props {
    filter: Filter;
    onlineFirst: boolean;
    sortField: SortField;
    sortDir: SortDir;
    onFilterChange: (f: Filter) => void;
    onOnlineFirstChange: (v: boolean) => void;
    onSortFieldChange: (f: SortField) => void;
    onSortDirChange: (d: SortDir) => void;
    onUserSelect: (id: number) => void;
}

export default ({
    filter,
    onlineFirst,
    sortField,
    sortDir,
    onFilterChange,
    onOnlineFirstChange,
    onSortFieldChange,
    onSortDirChange,
    onUserSelect,
}: Props) => (
    <div className="flex items-center flex-wrap gap-3 mb-4">
        <div className={"w-full " + (filter === "user" ? "sm:w-1/2" : "")}>
            <Select
                value={filter}
                onChange={(e) =>
                    onFilterChange(e.currentTarget.value as Filter)
                }
            >
                <option value={"all"}>All servers</option>
                <option value={"mine"}>My servers</option>
                <option value={"others"}>Other users&apos; servers</option>
                <option value={"user"}>Specific user...</option>
            </Select>
        </div>
        {filter === "user" && <UserSearchInput onSelect={onUserSelect} />}
        <Select
            value={sortField}
            onChange={(e) =>
                onSortFieldChange(e.currentTarget.value as SortField)
            }
            style={{
                width: "40%",
            }}
        >
            <option value={"name"}>Name</option>
            <option value={"created_at"}>Created</option>
            <option value={"updated_at"}>Updated</option>
        </Select>
        <Select
            value={sortDir}
            onChange={(e) => onSortDirChange(e.currentTarget.value as SortDir)}
            style={{
                width: "40%",
            }}
        >
            <option value={"asc"}>Ascending</option>
            <option value={"desc"}>Descending</option>
        </Select>
        <label
            className={
                "flex items-center gap-2 text-sm text-neutral-200 whitespace-nowrap"
            }
        >
            <input
                type={"checkbox"}
                checked={onlineFirst}
                onChange={(e) => onOnlineFirstChange(e.currentTarget.checked)}
            />
            Online first
        </label>
    </div>
);
