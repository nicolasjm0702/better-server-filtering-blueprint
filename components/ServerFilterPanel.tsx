import React, { useEffect, useState } from 'react';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { Server } from '@/api/server/getServer';
import { PaginatedResult } from '@/api/http';
import getServerResourceUsage from '@/api/server/getServerResourceUsage';
import ServerRow from '@/components/dashboard/ServerRow';
import Spinner from '@/components/elements/Spinner';
import Pagination from '@/components/elements/Pagination';
import FilterControls, { SortField, SortDir } from './FilterControls';
import getFilteredServers, { Filter } from './api/getFilteredServers';

export default () => {
    const rootAdmin = useStoreState((state: ApplicationStore) => state.user.data?.rootAdmin ?? false);

    const [filter, setFilter] = useState<Filter>('all');
    const [onlineFirst, setOnlineFirst] = useState(true);
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortDir, setSortDir] = useState<SortDir>('asc');
    const [userId, setUserId] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [result, setResult] = useState<PaginatedResult<Server> | null>(null);

    // Hide the legacy "Showing your/other's servers" toggle + its server list for
    // admins. Blueprint's BeforeContent slot doesn't put this component as a plain
    // CSS sibling of the toggle (a `~` sibling-selector rule proved insufficient
    // live), so instead this walks up from the toggle's actual `<input
    // name="show_all_servers">` (a stable attribute straight from panel source,
    // not a generated class) and hides that wrapper plus everything rendered after
    // it in the same parent — which is where the legacy Pagination's rows/pager
    // land, since Pagination renders a bare Fragment rather than a wrapping element.
    useEffect(() => {
        if (!rootAdmin) return;

        let frame: number | null = null;

        const hideLegacyDashboard = () => {
            const toggleInput = document.querySelector<HTMLInputElement>('input[name="show_all_servers"]');
            const toggleWrapper = toggleInput?.parentElement?.parentElement?.parentElement as HTMLElement | undefined;
            if (!toggleWrapper) return;

            toggleWrapper.style.display = 'none';
            let sibling = toggleWrapper.nextElementSibling as HTMLElement | null;
            while (sibling) {
                sibling.style.display = 'none';
                sibling = sibling.nextElementSibling as HTMLElement | null;
            }
        };

        const scheduleHide = () => {
            if (frame !== null) return;
            frame = requestAnimationFrame(() => {
                frame = null;
                hideLegacyDashboard();
            });
        };

        scheduleHide();

        // ponytail: body-level observer, debounced to one pass per animation frame —
        // the legacy dashboard's own data refresh can re-render/re-add these nodes
        // after our first pass. Scope to a narrower container if this ever shows up
        // as a real perf cost; dashboard-page DOM sizes don't warrant it yet.
        const observer = new MutationObserver(scheduleHide);
        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            observer.disconnect();
            if (frame !== null) cancelAnimationFrame(frame);
        };
    }, [rootAdmin]);

    useEffect(() => {
        if (!rootAdmin) return;
        if (filter === 'user' && !userId) return;

        getFilteredServers({ filter, userId, sort: sortField, dir: sortDir, page }).then((fetched) => {
            if (!onlineFirst) {
                setResult(fetched);
                return;
            }

            // "Online first" needs live power state, which the paginated servers
            // endpoint doesn't carry — fetch it per visible server, then stable-sort
            // (online first, offline after, chosen sort order preserved within each group).
            Promise.all(
                fetched.items.map((server) =>
                    getServerResourceUsage(server.uuid)
                        .then((stats) => stats.status !== 'offline')
                        .catch(() => false)
                )
            ).then((onlineFlags) => {
                const withFlags = fetched.items.map((server, index) => ({ server, online: onlineFlags[index] }));
                withFlags.sort((a, b) => Number(b.online) - Number(a.online));
                setResult({ ...fetched, items: withFlags.map((entry) => entry.server) });
            });
        });
    }, [rootAdmin, filter, onlineFirst, sortField, sortDir, userId, page]);

    if (!rootAdmin) return null;

    return (
        <div className={'betterserverfiltering-panel'}>
            <FilterControls
                filter={filter}
                onlineFirst={onlineFirst}
                sortField={sortField}
                sortDir={sortDir}
                onFilterChange={(f) => {
                    setFilter(f);
                    setPage(1);
                }}
                onOnlineFirstChange={setOnlineFirst}
                onSortFieldChange={(f) => {
                    setSortField(f);
                    setPage(1);
                }}
                onSortDirChange={(d) => {
                    setSortDir(d);
                    setPage(1);
                }}
                onUserSelect={(id) => {
                    setUserId(id);
                    setPage(1);
                }}
            />
            {!result ? (
                <Spinner centered size={'large'} />
            ) : (
                <Pagination data={result} onPageSelect={setPage}>
                    {({ items }) =>
                        items.length > 0 ? (
                            items.map((server, index) => (
                                <ServerRow
                                    key={server.uuid}
                                    server={server}
                                    className={index > 0 ? 'mt-2' : undefined}
                                />
                            ))
                        ) : (
                            <p className={'text-center text-sm text-neutral-400'}>No servers match this filter.</p>
                        )
                    }
                </Pagination>
            )}
        </div>
    );
};
