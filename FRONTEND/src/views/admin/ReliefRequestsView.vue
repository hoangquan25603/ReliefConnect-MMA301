<template>
  <AdminLayout>
    <div class="rrm-page">
      <!-- ── Header ─────────────────────────────────────── -->
      <div class="page-header">
        <div>
          <div class="role-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            {{ $t('admin.nav_requests') }}
          </div>
          <h1 class="page-title">{{ $t('admin.requests_title') }}</h1>
          <p class="page-sub">{{ $t('admin.requests_sub') }}</p>
        </div>
        <div class="header-stats">
          <div class="hstat" v-for="s in headerStats" :key="s.label" :style="{ '--hs-color': s.color }">
            <span class="hstat__val">{{ s.val }}</span>
            <span class="hstat__label">{{ s.label }}</span>
          </div>
        </div>
      </div>

      <!-- ── Filters ────────────────────────────────────── -->
      <div class="filter-bar">
        <div class="search-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            v-model="searchQuery"
            class="search-input"
            :placeholder="$t('admin.requests_search')"
          />
        </div>
        <div class="status-filters">
          <button
            v-for="f in statusFilters"
            :key="f.key"
            class="status-filter-btn"
            :class="{ active: activeFilter === f.key }"
            :style="activeFilter === f.key ? { '--af-bg': f.bg, '--af-color': f.color } : {}"
            @click="activeFilter = f.key"
          >
            <span class="filter-dot" :style="{ background: f.dot }" />
            {{ f.label }}
            <span class="filter-count">{{ f.count }}</span>
          </button>
        </div>
        <select v-model="sortBy" class="sort-select">
          <option value="newest">{{ $t('admin.sort_newest') }}</option>
          <option value="oldest">{{ $t('admin.sort_oldest') }}</option>
          <option value="emergency-desc">{{ $t('admin.sort_emergency_desc') }}</option>
          <option value="emergency-asc">{{ $t('admin.sort_emergency_asc') }}</option>
        </select>
      </div>

      <!-- ── Table ──────────────────────────────────────── -->
      <div class="table-card">
        <div v-if="isLoading" class="loading-state">
          <div class="spinner" />
          {{ $t('common.loading') }}
        </div>
        <div v-else-if="displayedRows.length === 0" class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          <p>{{ $t('admin.no_requests') }}</p>
        </div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>{{ $t('admin.col_request_title') }}</th>
              <th>{{ $t('admin.col_address') }}</th>
              <th class="th-center">{{ $t('admin.col_level') }}</th>
              <th class="th-center">{{ $t('admin.col_needs') }}</th>
              <th class="th-center">{{ $t('admin.col_status') }}</th>
              <th>{{ $t('admin.col_created') }}</th>
              <th class="th-center">{{ $t('admin.col_actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="req in paginatedRows"
              :key="req.id"
              class="data-row"
              @click="openDetail(req.id)"
            >
              <td class="td-title">
                <span class="title-text">{{ req.title }}</span>
                <span class="affect-info">{{ $t('admin.people_count', { count: req.affectedPeople }) }}</span>
              </td>
              <td class="td-address">{{ req.address }}</td>
              <td class="th-center">
                <span class="emergency-badge" :class="`elv-${req.emergencyLevel}`">
                  {{ EMERGENCY_LABELS[req.emergencyLevel] }}
                </span>
              </td>
              <td class="th-center">
                <div class="needs-icons">
                  <span v-if="req.needFood"     class="need-chip" title="Lương thực">🍚</span>
                  <span v-if="req.needWater"    class="need-chip" title="Nước sạch">💧</span>
                  <span v-if="req.needMedicine" class="need-chip" title="Thuốc men">💊</span>
                  <span v-if="req.needBlanket"  class="need-chip" title="Chăn màn">🛏</span>
                  <span v-if="req.needShelter"  class="need-chip" title="Nơi trú ẩn">🏠</span>
                </div>
              </td>
              <td class="th-center">
                <span class="status-badge" :style="badgeStyle(req.status)">
                  <span class="status-dot" :style="dotStyle(req.status)" />
                  {{ STATUS_LABEL_FULL[req.status] }}
                </span>
              </td>
              <td class="td-date">{{ formatDate(req.createdAt) }}</td>
              <td class="th-center" @click.stop>
                <div class="row-actions">
                  <button class="action-btn action-btn--details" @click="openDetail(req.id)">{{ $t('admin.btn_details') }}</button>
                  <button
                    v-if="req.status !== 'Pending'"
                    class="action-btn action-btn--team"
                    @click="goToTeamManagement(req.id)"
                  >{{ $t('admin.btn_manage_team') }}</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div v-if="displayedRows.length > pageSize" class="admin-pagination">
          <button class="page-btn" :disabled="!hasPrevPage" @click="changePage(-1)">{{ $t('admin.page_prev') }}</button>
          <span class="page-info">{{ $t('admin.page_info', { page: currentPage, total: totalPages }) }}</span>
          <button class="page-btn" :disabled="!hasNextPage" @click="changePage(1)">{{ $t('admin.page_next') }}</button>
        </div>
      </div>

      <!-- ── Detail Modal ──────────────────────────────── -->
      <Transition name="modal">
        <div v-if="drawerOpen" class="modal-overlay" @click.self="closeDrawer">
          <div class="modal-box">

            <!-- Header -->
            <div class="modal-header">
              <div class="modal-header__inner">
                <p class="modal-subtitle">{{ modalMode === 'team' ? $t('admin.team_modal_subtitle') : $t('admin.detail_request_title') }}</p>
                <h2 class="modal-title">{{ detail?.title }}</h2>
              </div>
              <button class="modal-close" @click="closeDrawer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <!-- Loading -->
            <div v-if="isDetailLoading" class="modal-loading">
              <div class="spinner" />
              {{ $t('common.loading') }}
            </div>
            <p v-else-if="detailError" class="status-msg msg--error" role="alert">{{ detailError }}</p>

            <div v-else-if="detail" class="modal-body">
              <!-- Row 1: Status + Emergency badges -->
              <div class="modal-badge-row">
                <span class="status-badge" :style="badgeStyle(detail.status)">
                  <span class="status-dot" :style="dotStyle(detail.status)" />
                  {{ STATUS_LABEL_FULL[detail.status] }}
                </span>
                <span class="emergency-badge" :class="`elv-${detail.emergencyLevel}`">
                  {{ EMERGENCY_LABELS[detail.emergencyLevel] }}
                </span>
              </div>

              <!-- Các khối thông tin chi tiết yêu cầu — chỉ hiện ở chế độ "Chi tiết" (mode=full),
                   ẩn khi mở từ "Quản lý đội" (mode=team) để đỡ rối, chỉ tập trung vào TNV/phân công. -->
              <template v-if="modalMode === 'full'">
                <!-- Info cards grid -->
                <div class="modal-cards">
                  <!-- Card: Thông tin liên hệ -->
                  <div class="info-card">
                    <div class="info-card__header">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      {{ $t('admin.section_contact_info') }}
                    </div>
                    <p class="info-card__sublabel">{{ $t('admin.affected_people_label') }}</p>
                    <p class="info-card__val">{{ $t('admin.people_count', { count: detail.affectedPeople }) }}</p>
                    <p class="info-card__sublabel" style="margin-top:10px">{{ $t('admin.phone_label') }}</p>
                    <p class="info-card__val">{{ detail.contactPhone }}</p>
                    <p class="info-card__sublabel" style="margin-top:10px">{{ $t('admin.coords_label') }}</p>
                    <p class="info-card__val info-card__val--small">{{ detail.latitude.toFixed(5) }}, {{ detail.longitude.toFixed(5) }}</p>
                  </div>

                  <!-- Card: Địa điểm & Thời gian -->
                  <div class="info-card">
                    <div class="info-card__header">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {{ $t('admin.section_location_time') }}
                    </div>
                    <p class="info-card__sublabel">{{ $t('admin.col_address') }}</p>
                    <p class="info-card__val">{{ detail.address }}</p>
                    <p class="info-card__sublabel" style="margin-top:10px">{{ $t('admin.col_region') }}</p>
                    <p class="info-card__val">{{ detail.region || '—' }}</p>
                    <p class="info-card__sublabel" style="margin-top:10px">{{ $t('admin.created_date_label') }}</p>
                    <div class="info-card__datebox">{{ formatDate(detail.createdAt) }}</div>
                  </div>
                </div>

                <!-- Mô tả -->
                <div class="modal-section">
                  <p class="modal-section__label">{{ $t('admin.section_desc') }}</p>
                  <p class="modal-section__text">{{ detail.description }}</p>
                </div>

                <!-- Nhu cầu -->
                <div class="modal-section">
                  <p class="modal-section__label">{{ $t('admin.section_needs') }}</p>
                  <div class="needs-tags">
                    <span v-if="detail.needFood"     class="need-tag">🍚 Lương thực</span>
                    <span v-if="detail.needWater"    class="need-tag">💧 Nước sạch</span>
                    <span v-if="detail.needMedicine" class="need-tag">💊 Thuốc men</span>
                    <span v-if="detail.needBlanket"  class="need-tag">🛏 Chăn màn</span>
                    <span v-if="detail.needShelter"  class="need-tag">🏠 Nơi trú ẩn</span>
                    <span v-if="!detail.needFood && !detail.needWater && !detail.needMedicine && !detail.needBlanket && !detail.needShelter" class="need-tag need-tag--none">{{ $t('admin.no_specific_needs') }}</span>
                  </div>
                </div>

                <!-- Đổi trạng thái -->
                <div class="modal-section">
                  <p class="modal-section__label">{{ $t('admin.section_change_status') }}</p>
                  <div v-if="STATUS_TRANSITIONS[detail.status]?.length" class="status-inputs">
                    <label class="status-input-field">
                      {{ $t('admin.target_headcount_label') }}
                      <span v-if="detail.status === 'Pending'" class="required-mark">*</span>
                      <span v-if="detail.suggestedHeadcountMin != null" class="status-input-hint">
                        {{ $t('admin.suggested_headcount_hint', { min: detail.suggestedHeadcountMin, max: detail.suggestedHeadcountMax }) }}
                      </span>
                      <input
                        v-model.number="targetHeadcountInput"
                        type="number"
                        min="1"
                        :required="detail.status === 'Pending'"
                        :placeholder="detail.targetHeadcount != null ? String(detail.targetHeadcount) : ''"
                      />
                    </label>
                    <label class="status-input-field">
                      {{ $t('admin.status_note_label') }}
                      <textarea v-model="statusNoteInput" rows="2" />
                    </label>
                  </div>
                  <div class="status-flow">
                    <button
                      v-for="s in STATUS_TRANSITIONS[detail.status] ?? []"
                      :key="s"
                      class="flow-btn"
                      :class="`flow-btn--${s.toLowerCase()}`"
                      :disabled="isUpdating || (s === 'Approved' && !isTargetHeadcountValid)"
                      :title="s === 'Approved' && !isTargetHeadcountValid ? $t('admin.target_headcount_required') : ''"
                      @click="changeStatus(s)"
                    >
                      <svg v-if="isUpdating && pendingStatus === s" class="spin-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-9-9"/></svg>
                      {{ STATUS_LABEL_FULL[s] }}
                    </button>
                    <span v-if="!STATUS_TRANSITIONS[detail.status]?.length" class="flow-none">{{ $t('admin.no_status_transition') }}</span>
                  </div>
                  <p v-if="statusMsg" class="status-msg" :class="statusMsgType === 'error' ? 'msg--error' : 'msg--ok'">{{ statusMsg }}</p>

                  <div v-if="inventoryIssues.length" class="inventory-issues">
                    <p class="inventory-issues__title">{{ $t('admin.inventory_issues_title') }}</p>
                    <p>Lịch sử cấp phát tại lúc duyệt; không phải tồn kho hiện tại.</p>
                    <ul class="inventory-issues__list">
                      <li
                        v-for="issue in inventoryIssues"
                        :key="issue.category"
                        class="inventory-issues__item"
                        :class="{ 'inventory-issues__item--short': !issue.isFullyIssued }"
                      >
                        <span class="inventory-issues__category">{{ needCategoryLabel(issue.category) }}</span>:
                        {{ $t('admin.inventory_issued', { issued: issue.issuedQuantity, requested: issue.requestedQuantity }) }}
                        <span v-if="!issue.isFullyIssued" class="inventory-issues__warning">
                          — {{ issue.requiresManualAllocation ? 'Cần chọn vật tư và xuất kho thủ công' : $t('admin.inventory_shortfall') }}
                        </span>
                        <p v-if="issue.reason" class="inventory-issues__warning">{{ issue.reason }}</p>
                      </li>
                    </ul>
                  </div>
                </div>
              </template>

              <!-- Gợi ý TNV (chỉ khi Approved) -->
              <div v-if="detail.status === 'Approved'" class="modal-section">
                <div class="suggested-header">
                  <p class="modal-section__label" style="margin-bottom:0">{{ $t('admin.suggested_volunteers') }}</p>
                  <div class="suggested-header__right">
                    <span class="allocate-progress" :class="{ 'allocate-progress--full': isFullyAllocated }">
                      {{ $t('admin.allocate_progress', { current: allocatedCount, target: targetHeadcountValue }) }}
                    </span>
                  </div>
                </div>
                <p v-if="isFullyAllocated" class="allocate-full-note">{{ $t('admin.allocate_full_note') }}</p>
                <div v-if="isSuggestLoading" class="suggest-loading"><div class="spinner" /> {{ $t('admin.suggest_searching') }}</div>
                <div v-else-if="suggestedVolunteers.length === 0" class="suggest-empty">{{ $t('admin.no_suggested_volunteers') }}</div>
                <template v-else>
                  <p v-if="isFallbackVolunteers" class="fallback-note">{{ $t('admin.fallback_no_nearby_note') }}</p>
                  <div class="auto-assign-bar">
                    <button
                      class="btn-auto-assign"
                      :disabled="isAutoAssigning || isFullyAllocated"
                      @click="autoAssignTeam"
                    >
                      <svg v-if="isAutoAssigning" class="spin-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-9-9"/></svg>
                      <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      {{ $t('admin.btn_auto_assign') }}
                    </button>
                  </div>
                  <div v-if="autoAssignResults.length > 0" class="auto-assign-results">
                    <p v-if="autoAssignSummary" class="auto-assign-summary">{{ autoAssignSummary }}</p>
                    <div
                      v-for="r in autoAssignResults"
                      :key="r.volunteerProfileId"
                      class="auto-assign-row"
                      :class="r.ok ? 'auto-assign-row--ok' : 'auto-assign-row--error'"
                    >
                      <svg v-if="r.ok" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      <span class="auto-assign-row__name">{{ r.fullName }}</span>
                      <span class="auto-assign-row__msg">{{ r.ok ? $t('admin.auto_assign_row_ok') : r.message }}</span>
                    </div>
                  </div>
                </template>
                <div v-if="!isSuggestLoading && suggestedVolunteers.length > 0" class="volunteer-cards" style="margin-top:10px">
                  <div v-for="vol in suggestedVolunteers" :key="vol.volunteerProfileId" class="vol-card">
                    <div class="vol-card__avatar">{{ vol.fullName.split(' ').at(-1)?.[0] ?? '?' }}</div>
                    <div class="vol-card__info">
                      <p class="vol-card__name">{{ vol.fullName }}</p>
                      <div class="vol-card__tags">
                        <span class="vol-tag vol-tag--dist">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          {{ vol.distanceKm.toFixed(1) }} km
                        </span>
                        <span class="vol-tag vol-tag--exp">{{ $t('admin.experience_years_short', { years: vol.experienceYears }) }}</span>
                        <span class="vol-tag">{{ $t('admin.completed_assignments_short', { count: vol.completedAssignmentsCount }) }}</span>
                        <span v-for="sk in vol.matchedSkillNames.slice(0, 2)" :key="sk" class="vol-tag">{{ sk }}</span>
                        <span v-if="vol.matchedSkillNames.length > 2" class="vol-tag vol-tag--more">+{{ vol.matchedSkillNames.length - 2 }}</span>
                      </div>
                    </div>
                    <button
                      class="btn-assign"
                      :disabled="isFullyAllocated || (isAssigning && assigningId === vol.volunteerProfileId)"
                      @click="assignVolunteer(vol)"
                    >
                      <svg v-if="isAssigning && assigningId === vol.volunteerProfileId" class="spin-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-9-9"/></svg>
                      <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      {{ $t('admin.btn_assign') }}
                    </button>
                  </div>
                </div>
                <!-- Tìm TNV khác — không giới hạn ở danh sách gợi ý lân cận -->
                <div class="vol-search-block">
                  <p class="modal-section__label" style="margin-bottom:8px">{{ $t('admin.search_volunteers_title') }}</p>
                  <div class="vol-search-wrap">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input
                      v-model="volSearchQuery"
                      class="vol-search-input"
                      :placeholder="$t('admin.search_volunteers_placeholder')"
                    />
                  </div>
                  <div v-if="volSearchQuery.trim()" class="vol-search-results">
                    <div v-if="isLoadingAllVolunteers" class="suggest-loading"><div class="spinner" /> {{ $t('common.loading') }}</div>
                    <div v-else-if="volSearchResults.length === 0" class="suggest-empty">{{ $t('admin.no_search_results') }}</div>
                    <div v-else class="volunteer-cards">
                      <div v-for="v in volSearchResults" :key="v.id" class="vol-card">
                        <div class="vol-card__avatar">{{ v.fullName.split(' ').at(-1)?.[0] ?? '?' }}</div>
                        <div class="vol-card__info">
                          <p class="vol-card__name">{{ v.fullName }}</p>
                          <div class="vol-card__tags">
                            <span class="vol-tag">{{ v.phoneNumber }}</span>
                            <span class="vol-tag vol-tag--exp">{{ $t('admin.experience_years_short', { years: v.experienceYears }) }}</span>
                          </div>
                        </div>
                        <button
                          class="btn-assign"
                          :disabled="isFullyAllocated || (isAssigning && assigningId === v.id)"
                          @click="assignSearchedVolunteer(v)"
                        >
                          <svg v-if="isAssigning && assigningId === v.id" class="spin-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 1 1-9-9"/></svg>
                          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                          {{ $t('admin.btn_assign') }}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <p v-if="assignMsg" class="status-msg" :class="assignMsgType === 'error' ? 'msg--error' : 'msg--ok'">{{ assignMsg }}</p>
              </div>

              <!-- Đội tình nguyện đã gán (trước đây phải sang trang /admin/assignments) -->
              <div v-if="detail.status !== 'Pending'" ref="teamSectionEl" class="modal-section">
                <p class="modal-section__label">{{ $t('admin.assigned_team_title') }}</p>

                <div v-if="isTeamLoading" class="suggest-loading"><div class="spinner" /> {{ $t('common.loading') }}</div>
                <div v-else-if="assignedTeam.length === 0" class="suggest-empty">{{ $t('admin.no_assigned_team') }}</div>
                <div v-else class="team-rows">
                  <div v-for="row in assignedTeam" :key="row.id" class="team-row">
                    <div class="team-row__main">
                      <div class="vol-card__avatar">{{ row.volunteerFullName.split(' ').at(-1)?.[0] ?? '?' }}</div>
                      <div class="team-row__info">
                        <p class="team-row__name">
                          {{ row.volunteerFullName }}
                          <svg v-if="row.isTeamLead" class="lead-icon" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" :title="$t('admin.team_lead_badge')"><path d="M12 2l2.4 7.2H22l-6 4.6 2.3 7.2L12 16.4l-6.3 4.6 2.3-7.2-6-4.6h7.6z"/></svg>
                        </p>
                        <span class="asn-status-badge" :style="asnBadgeStyle(row.status)">{{ ASN_STATUS_LABEL[row.status] }}</span>
                        <span v-if="row.cancellationRequested" class="cancel-flag">{{ $t('admin.has_cancel_request') }}</span>
                      </div>
                    </div>
                    <div class="team-row__actions" v-if="row.status === 'Accepted' || row.status === 'OnTheWay'">
                      <button
                        v-if="!row.isTeamLead"
                        class="btn-team-lead"
                        :disabled="teamActioningId === row.id"
                        @click="handleSetTeamLead(row.id)"
                      >{{ $t('admin.btn_set_team_lead') }}</button>
                      <button
                        v-else
                        class="btn-remove-team-lead"
                        :disabled="teamActionType === 'unlead'"
                        @click="handleRemoveTeamLead"
                      >{{ $t('admin.btn_remove_team_lead') }}</button>
                      <button
                        v-if="cancelingRowId !== row.id"
                        class="btn-cancel-row"
                        @click="cancelingRowId = row.id"
                      >{{ $t('admin.btn_cancel_assignment') }}</button>
                    </div>
                    <div v-if="cancelingRowId === row.id" class="team-row__cancel-box">
                      <input
                        v-model="cancelReasonById[row.id]"
                        class="cancel-reason-input"
                        :placeholder="$t('admin.cancel_reason_placeholder')"
                      />
                      <button
                        class="btn-cancel-confirm"
                        :disabled="!cancelReasonById[row.id]?.trim() || teamActioningId === row.id"
                        @click="handleCancelAssignment(row)"
                      >{{ $t('admin.btn_confirm') }}</button>
                      <button class="btn-cancel-dismiss" @click="cancelingRowId = null">{{ $t('admin.btn_dismiss') }}</button>
                    </div>
                  </div>
                </div>
                <p v-if="teamMsg" class="status-msg" :class="teamMsgType === 'error' ? 'msg--error' : 'msg--ok'">{{ teamMsg }}</p>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import {
  getReliefRequests,
  getReliefRequestById,
  updateReliefRequestStatus,
  removeTeamLead,
} from '@/features/requests/requests.api'
import { getSuggestedVolunteers, createAssignment } from '@/features/requests/admin-requests.api'
import {
  badgeStyle,
  dotStyle,
} from '@/features/requests/requests.helpers'
import type { ReliefRequestResponse, ReliefRequestStatus, InventoryIssueResult } from '@/features/requests/requests.types'
import type { SuggestedVolunteer } from '@/features/requests/admin-requests.api'
import { getAssignments, setTeamLead, adminCancelAssignment, type Assignment, type AssignmentStatus } from '@/features/tasks/assignments.api'
import { getAdminVolunteers, type VolunteerSummary } from '@/features/volunteers/admin-volunteers.api'

const { locale, t } = useI18n()
const route = useRoute()
const router = useRouter()

const formatDate = (dateStr: string) => {
  void locale.value
  return new Date(dateStr).toLocaleString(locale.value === 'vi' ? 'vi-VN' : 'en-US')
}

// ── Const maps ───────────────────────────────────────────────
const EMERGENCY_LABELS = computed<Record<number, string>>(() => {
  void locale.value
  return {
    1: t('coordinator.emergency_low'),
    2: t('coordinator.emergency_large_scale'),
    3: t('coordinator.emergency_severe'),
  }
})

const STATUS_LABEL_FULL = computed<Record<ReliefRequestStatus, string>>(() => {
  void locale.value
  return {
    Pending:    t('admin.status_pending'),
    Approved:   t('admin.status_approved'),
    Assigned:   locale.value === 'vi' ? 'Đã giao' : 'Assigned',
    InProgress: locale.value === 'vi' ? 'Đang xử lý' : 'In Progress',
    Completed:  locale.value === 'vi' ? 'Hoàn thành' : 'Completed',
    Cancelled:  locale.value === 'vi' ? 'Đã hủy' : 'Cancelled',
  }
})

// State machine: Admin có thể đổi theo đúng flow
const STATUS_TRANSITIONS: Partial<Record<ReliefRequestStatus, ReliefRequestStatus[]>> = {
  Pending:    ['Approved', 'Cancelled'],
  Approved:   ['Cancelled'],
  Assigned:   ['Cancelled'],
  InProgress: ['Completed', 'Cancelled'],
}

// ── State ────────────────────────────────────────────────────
const allRequests = ref<ReliefRequestResponse[]>([])
const isLoading   = ref(true)

const searchQuery  = ref('')
const activeFilter = ref<string>('all')
const sortBy       = ref<string>('newest')

const drawerOpen      = ref(false)
const detail          = ref<ReliefRequestResponse | null>(null)
const isDetailLoading = ref(false)
const detailError = ref('')
const teamSectionEl   = ref<HTMLElement | null>(null)
// 'full' = "Chi tiết" (toàn bộ thông tin yêu cầu); 'team' = "Quản lý đội" (chỉ phần
// liên quan đến TNV/phân công — ẩn thông tin liên hệ, địa điểm, mô tả, đổi trạng thái).
const modalMode = ref<'full' | 'team'>('full')

const isUpdating   = ref(false)
const pendingStatus = ref<ReliefRequestStatus | null>(null)
const statusMsg    = ref('')
const statusMsgType = ref<'ok' | 'error'>('ok')
// [Giới hạn tồn kho] Chi tiết cấp phát thực tế trả về sau khi duyệt (Approved) — reset mỗi lần đổi status
const inventoryIssues = ref<InventoryIssueResult[]>([])

const NEED_CATEGORY_LABELS: Record<string, string> = {
  Food: 'Lương thực', Water: 'Nước sạch', Medicine: 'Thuốc men',
  Blanket: 'Chăn màn', Shelter: 'Nơi trú ẩn', Other: 'Khác',
}
function needCategoryLabel(category: string): string {
  return NEED_CATEGORY_LABELS[category] ?? category
}

const targetHeadcountInput = ref<number | null>(null)

// Duyệt đơn (Pending → Approved) bắt buộc phải điền số người tối thiểu cứu trợ —
// các bước chuyển trạng thái khác không cần (đã có targetHeadcount từ lúc duyệt).
const isTargetHeadcountValid = computed(() => {
  if (detail.value?.status !== 'Pending') return true
  return targetHeadcountInput.value != null && targetHeadcountInput.value >= 1
})
const statusNoteInput = ref('')

const suggestedVolunteersRaw = ref<SuggestedVolunteer[]>([])
const isSuggestLoading    = ref(false)
// true khi danh sách trên là fallback "toàn bộ người đang rảnh" (không tìm được ai lân cận)
const isFallbackVolunteers = ref(false)

// ── TNV đã nhận đủ số nhiệm vụ đang hoạt động tối đa cho phép — loại khỏi gợi ý/tìm
// kiếm để tránh phân công chồng chéo, dồn việc lên 1 người (đếm trên TOÀN hệ thống,
// không chỉ riêng yêu cầu đang mở).
const MAX_ACTIVE_TASKS_PER_VOLUNTEER = 2
const busyVolunteerIds = ref<Set<string>>(new Set())

const suggestedVolunteers = computed(() =>
  suggestedVolunteersRaw.value.filter((v) => !busyVolunteerIds.value.has(v.volunteerProfileId)),
)

async function loadVolunteerWorkloads() {
  try {
    const all = await getAssignments(1, 200)
    const counts = new Map<string, number>()
    for (const a of all) {
      if (a.status === 'Assigned' || a.status === 'Accepted' || a.status === 'OnTheWay') {
        counts.set(a.volunteerProfileId, (counts.get(a.volunteerProfileId) ?? 0) + 1)
      }
    }
    busyVolunteerIds.value = new Set(
      [...counts.entries()]
        .filter(([, count]) => count >= MAX_ACTIVE_TASKS_PER_VOLUNTEER)
        .map(([id]) => id),
    )
  } catch (e) {
    console.error(e)
  }
}

// ── Tìm TNV theo tên/SĐT — không giới hạn ở danh sách gợi ý lân cận ─────────────
const volSearchQuery       = ref('')
const allVolunteersForSearch = ref<VolunteerSummary[]>([])
const isLoadingAllVolunteers = ref(false)

const isAssigning  = ref(false)
const assigningId  = ref<string | null>(null)
const assignMsg    = ref('')
const assignMsgType = ref<'ok' | 'error'>('ok')

// Số người đã phân bổ thành công cho yêu cầu đang mở (đếm dồn cả phân công lẻ từng
// dòng lẫn phân công tự động theo lô) — so với targetHeadcount để khoá nút khi đủ.
const allocatedCount = ref(0)
const targetHeadcountValue = computed(() => detail.value?.targetHeadcount ?? 1)
const isFullyAllocated = computed(() => allocatedCount.value >= targetHeadcountValue.value)

// ── Tự động phân công đội tối thiểu ─────────────────────────
interface AutoAssignResult {
  volunteerProfileId: string
  fullName: string
  ok: boolean
  message: string
}
const isAutoAssigning   = ref(false)
const autoAssignResults = ref<AutoAssignResult[]>([])
const autoAssignSummary = ref('')

// ── Đội tình nguyện đã gán cho yêu cầu đang mở ──────────────────
// Gộp thẳng vào modal chi tiết (thay vì điều hướng sang trang Phân công) để "Quản lý đội"
// không còn tốn thêm 1 lượt chuyển trang.
const assignedTeam    = ref<Assignment[]>([])
const isTeamLoading   = ref(false)
const teamMsg         = ref('')
const teamMsgType     = ref<'ok' | 'error'>('ok')
const teamActioningId = ref<string | null>(null)
const teamActionType  = ref<'lead' | 'unlead' | 'cancel' | null>(null)
const cancelReasonById = ref<Record<string, string>>({})
const cancelingRowId   = ref<string | null>(null)

const ASN_STATUS_LABEL = computed<Record<AssignmentStatus, string>>(() => {
  void locale.value
  return {
    Assigned:  t('admin.asn_status_assigned'),
    Accepted:  t('admin.asn_status_accepted'),
    OnTheWay:  t('admin.asn_status_ontheway'),
    Completed: t('admin.status_completed_short'),
    Cancelled: t('admin.status_cancelled_short'),
  }
})
const ASN_STATUS_STYLE: Record<AssignmentStatus, { bg: string; color: string; dot: string }> = {
  Assigned:  { bg: '#dbeafe', color: '#1d4ed8', dot: '#3b82f6' },
  Accepted:  { bg: '#ede9fe', color: '#6d28d9', dot: '#8b5cf6' },
  OnTheWay:  { bg: '#ffedd5', color: '#9a3412', dot: '#f97316' },
  Completed: { bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
  Cancelled: { bg: '#f1f5f9', color: '#4b5563', dot: '#94a3b8' },
}
function asnBadgeStyle(s: AssignmentStatus) {
  const c = ASN_STATUS_STYLE[s]
  return { background: c.bg, color: c.color }
}

// TNV đã có phân công đang hoạt động (chưa huỷ) trên CHÍNH yêu cầu đang mở — loại khỏi
// kết quả tìm kiếm để khỏi gán trùng người đã có trong đội.
const assignedVolunteerIds = computed(() =>
  new Set(assignedTeam.value.filter(a => a.status !== 'Cancelled').map(a => a.volunteerProfileId)),
)

const volSearchResults = computed(() => {
  const q = volSearchQuery.value.trim().toLowerCase()
  if (!q) return []
  return allVolunteersForSearch.value
    .filter(v => v.status === 'Approved')
    .filter(v => !assignedVolunteerIds.value.has(v.id))
    .filter(v => !busyVolunteerIds.value.has(v.id))
    .filter(v => v.fullName.toLowerCase().includes(q) || v.phoneNumber.includes(q))
    .slice(0, 20)
})

// ── Computed ─────────────────────────────────────────────────
const statusFilters = computed(() => {
  void locale.value
  const all = allRequests.value
  const countOf = (s: ReliefRequestStatus) => all.filter(r => r.status === s).length
  return [
    { key: 'all',        label: locale.value === 'vi' ? 'Tất cả' : 'All', dot: '#94a3b8', bg: '#f1f5f9', color: '#475569', count: all.length },
    { key: 'Pending',    label: t('admin.status_pending'),  dot: '#f59e0b', bg: '#fef3c7', color: '#b45309', count: countOf('Pending') },
    { key: 'Approved',   label: t('admin.status_approved'), dot: '#22c55e', bg: '#dcfce7', color: '#15803d', count: countOf('Approved') },
    { key: 'Assigned',   label: STATUS_LABEL_FULL.value.Assigned,   dot: '#3b82f6', bg: '#dbeafe', color: '#1d4ed8', count: countOf('Assigned') },
    { key: 'InProgress', label: STATUS_LABEL_FULL.value.InProgress, dot: '#8b5cf6', bg: '#ede9fe', color: '#6d28d9', count: countOf('InProgress') },
    { key: 'Completed',  label: STATUS_LABEL_FULL.value.Completed,  dot: '#10b981', bg: '#d1fae5', color: '#065f46', count: countOf('Completed') },
    { key: 'Cancelled',  label: STATUS_LABEL_FULL.value.Cancelled,  dot: '#9ca3af', bg: '#f3f4f6', color: '#4b5563', count: countOf('Cancelled') },
  ]
})

const headerStats = computed(() => {
  void locale.value
  return [
    { label: t('admin.status_pending'),  val: allRequests.value.filter(r => r.status === 'Pending').length,    color: '#f59e0b' },
    { label: t('admin.status_approved'),   val: allRequests.value.filter(r => r.status === 'Approved').length,   color: '#22c55e' },
    { label: STATUS_LABEL_FULL.value.InProgress, val: allRequests.value.filter(r => r.status === 'InProgress').length, color: '#8b5cf6' },
    { label: STATUS_LABEL_FULL.value.Completed, val: allRequests.value.filter(r => r.status === 'Completed').length,  color: '#10b981' },
  ]
})

const filteredRequests = computed(() => {
  let list = allRequests.value
  if (activeFilter.value !== 'all') {
    list = list.filter(r => r.status === activeFilter.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.address.toLowerCase().includes(q),
    )
  }
  return list
})

const displayedRows = computed(() => {
  const list = [...filteredRequests.value]
  if (sortBy.value === 'newest')        list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  if (sortBy.value === 'oldest')        list.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  if (sortBy.value === 'emergency-desc') list.sort((a, b) => b.emergencyLevel - a.emergencyLevel)
  if (sortBy.value === 'emergency-asc')  list.sort((a, b) => a.emergencyLevel - b.emergencyLevel)
  return list
})

// ── Phân trang (giống trang Quản lý người dùng) ─────────────────
const pageSize    = 10
const currentPage = ref(1)
const totalPages  = computed(() => Math.ceil(displayedRows.value.length / pageSize) || 1)
const hasPrevPage = computed(() => currentPage.value > 1)
const hasNextPage = computed(() => currentPage.value < totalPages.value)
const paginatedRows = computed(() =>
  displayedRows.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize),
)
function changePage(delta: number) {
  currentPage.value = Math.min(Math.max(1, currentPage.value + delta), totalPages.value)
}
// Lọc/tìm/sắp xếp thay đổi → quay về trang 1 để khỏi kẹt ở trang trống
watch([activeFilter, searchQuery, sortBy], () => { currentPage.value = 1 })
// Danh sách co lại sau khi đổi trạng thái... — kéo về trang cuối hợp lệ thay vì kẹt ở trang trống
watch(totalPages, (tp) => { if (currentPage.value > tp) currentPage.value = tp })

// ── Lifecycle ────────────────────────────────────────────────
// Cho phép Coordinator Dashboard mở thẳng chi tiết 1 yêu cầu qua query (?id=...)
onMounted(async () => {
  try {
    allRequests.value = await getReliefRequests(1, 200)
  } catch (e) {
    console.error(e)
  } finally {
    isLoading.value = false
  }

  const targetId = route.query.id as string | undefined
  if (targetId) {
    openDetail(targetId)
    const { id, ...rest } = route.query
    router.replace({ query: rest })
  }
})

// ── Methods ──────────────────────────────────────────────────
async function openDetail(id: string, mode: 'full' | 'team' = 'full') {
  drawerOpen.value = true
  modalMode.value = mode
  detail.value = null
  suggestedVolunteersRaw.value = []
  isFallbackVolunteers.value = false
  allocatedCount.value = 0
  statusMsg.value = ''
  inventoryIssues.value = []
  assignMsg.value = ''
  autoAssignResults.value = []
  autoAssignSummary.value = ''
  targetHeadcountInput.value = null
  statusNoteInput.value = ''
  assignedTeam.value = []
  teamMsg.value = ''
  volSearchQuery.value = ''
  isDetailLoading.value = true
  detailError.value = ''
  try {
    detail.value = await getReliefRequestById(id)
    inventoryIssues.value = detail.value.inventoryIssues ?? []
    if (detail.value?.status === 'Approved') {
      loadSuggested()
      loadAllVolunteersForSearch()
    }
    if (detail.value && detail.value.status !== 'Pending') {
      loadTeam(id)
    }
  } catch (e) {
    detailError.value = e instanceof Error ? e.message : 'Không tải được chi tiết yêu cầu.'
  } finally {
    isDetailLoading.value = false
    if (mode === 'team') {
      nextTick(() => {
        teamSectionEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }
}

// PHẦN B — nạp đội tình nguyện đã gán cho yêu cầu đang mở, hiển thị ngay trong modal
// (thay vì bắt admin nhảy sang trang /admin/assignments để "Quản lý đội").
async function loadTeam(reliefRequestId: string) {
  isTeamLoading.value = true
  try {
    assignedTeam.value = await getAssignments(1, 50, reliefRequestId)
  } catch (e) {
    console.error(e)
  } finally {
    isTeamLoading.value = false
  }
}

async function handleSetTeamLead(assignmentId: string) {
  teamActioningId.value = assignmentId
  teamActionType.value = 'lead'
  teamMsg.value = ''
  try {
    await setTeamLead(assignmentId)
    if (detail.value) await loadTeam(detail.value.id)
    teamMsg.value = t('admin.team_lead_set_success')
    teamMsgType.value = 'ok'
  } catch (e: unknown) {
    teamMsg.value = e instanceof Error ? e.message : t('admin.team_lead_action_failed')
    teamMsgType.value = 'error'
  } finally {
    teamActioningId.value = null
    teamActionType.value = null
  }
}

async function handleRemoveTeamLead() {
  if (!detail.value) return
  teamActionType.value = 'unlead'
  teamMsg.value = ''
  try {
    await removeTeamLead(detail.value.id)
    await loadTeam(detail.value.id)
    teamMsg.value = t('admin.team_lead_removed_success')
    teamMsgType.value = 'ok'
  } catch (e: unknown) {
    teamMsg.value = e instanceof Error ? e.message : t('admin.team_lead_action_failed')
    teamMsgType.value = 'error'
  } finally {
    teamActionType.value = null
  }
}

async function handleCancelAssignment(row: Assignment) {
  const reason = (cancelReasonById.value[row.id] ?? '').trim()
  if (!reason) return
  teamActioningId.value = row.id
  teamActionType.value = 'cancel'
  teamMsg.value = ''
  try {
    await adminCancelAssignment(row.id, reason)
    cancelReasonById.value[row.id] = ''
    cancelingRowId.value = null
    if (detail.value) await loadTeam(detail.value.id)
    teamMsg.value = t('admin.assignment_cancel_success')
    teamMsgType.value = 'ok'
  } catch (e: unknown) {
    teamMsg.value = e instanceof Error ? e.message : t('admin.team_lead_action_failed')
    teamMsgType.value = 'error'
  } finally {
    teamActioningId.value = null
    teamActionType.value = null
  }
}

function closeDrawer() {
  drawerOpen.value = false
  detail.value = null
}

// Không giới hạn khoảng cách nào coi như "lấy hết" — dùng cho fallback bước 2 khi
// không có ai lân cận rảnh, tái dùng thẳng endpoint suggested-volunteers hiện có.
const UNLIMITED_DISTANCE_KM = 100000

async function loadSuggested() {
  if (!detail.value) return
  isSuggestLoading.value = true
  suggestedVolunteersRaw.value = []
  isFallbackVolunteers.value = false
  allocatedCount.value = 0
  try {
    await loadVolunteerWorkloads()
    const isFree = (v: SuggestedVolunteer) => !busyVolunteerIds.value.has(v.volunteerProfileId)

    // Bước 1 — ưu tiên lân cận + đang rảnh (BE mặc định bán kính 50km).
    const nearby = await getSuggestedVolunteers(detail.value.id)

    if (nearby.some(isFree)) {
      suggestedVolunteersRaw.value = nearby
    } else {
      // Bước 2 — không ai lân cận còn nhận thêm việc được → fallback lấy TẤT CẢ
      // người đang rảnh, bỏ giới hạn khoảng cách (vẫn cùng 1 endpoint, chỉ đổi
      // maxDistanceKm).
      const allAvailable = await getSuggestedVolunteers(detail.value.id, {
        maxDistanceKm: UNLIMITED_DISTANCE_KM,
        top: 50,
      })
      suggestedVolunteersRaw.value = allAvailable
      isFallbackVolunteers.value = allAvailable.some(isFree)
    }

    autoAssignResults.value = []
    autoAssignSummary.value = ''
  } catch (e) {
    console.error(e)
  } finally {
    isSuggestLoading.value = false
  }
}

async function changeStatus(newStatus: ReliefRequestStatus) {
  if (!detail.value) return
  if (newStatus === 'Approved' && !isTargetHeadcountValid.value) {
    statusMsg.value = t('admin.target_headcount_required')
    statusMsgType.value = 'error'
    return
  }
  isUpdating.value = true
  pendingStatus.value = newStatus
  statusMsg.value = ''
  inventoryIssues.value = []
  try {
    const result = await updateReliefRequestStatus(
      detail.value.id,
      newStatus,
      statusNoteInput.value,
      targetHeadcountInput.value ?? undefined,
    )
    inventoryIssues.value = result.inventoryIssues ?? detail.value.inventoryIssues ?? []
    // cập nhật local
    const newTargetHeadcount = targetHeadcountInput.value ?? detail.value.targetHeadcount
    const idx = allRequests.value.findIndex(r => r.id === detail.value!.id)
    if (idx !== -1) allRequests.value[idx] = { ...allRequests.value[idx], status: newStatus, targetHeadcount: newTargetHeadcount }
    detail.value = { ...detail.value, status: newStatus, targetHeadcount: newTargetHeadcount, inventoryIssues: inventoryIssues.value }
    statusMsg.value = `Đã chuyển sang "${STATUS_LABEL_FULL.value[newStatus]}" thành công.`
    statusMsgType.value = 'ok'
    targetHeadcountInput.value = null
    statusNoteInput.value = ''
    // nếu vừa Approved → tải suggested volunteers
    if (newStatus === 'Approved') {
      loadSuggested()
      loadAllVolunteersForSearch()
    } else {
      suggestedVolunteersRaw.value = []
    }
  } catch (e: unknown) {
    statusMsg.value = e instanceof Error ? e.message : 'Cập nhật thất bại.'
    statusMsgType.value = 'error'
  } finally {
    isUpdating.value = false
    pendingStatus.value = null
  }
}

// BE tự chuyển ReliefRequest Approved → Assigned ngay sau NGƯỜI ĐẦU TIÊN được phân công,
// trong khi POST /assignments lại chỉ chấp nhận khi request đang Approved (xem README luồng
// Admin bước K→L: "Có thể phân công thêm TNV" — nhưng thực tế BE từ chối vì đã rời Approved).
// Do modal cố tình KHÔNG cập nhật detail.value.status ngay sau lần gán đầu (để danh sách gợi ý
// không biến mất giữa chừng), các lượt gán tiếp theo trong cùng phiên sẽ dính lỗi "phải Approved".
// Workaround an toàn: nếu đúng lỗi này, tự PUT lại status Approved rồi thử gán lại đúng 1 lần
// trước khi báo lỗi thật cho admin.
async function assignOneVolunteer(
  volunteerProfileId: string,
): Promise<{ ok: true } | { ok: false; message: string; statusLocked: boolean }> {
  if (!detail.value) return { ok: false, message: t('admin.assign_failed'), statusLocked: false }
  const reliefRequestId = detail.value.id
  try {
    await createAssignment({ reliefRequestId, volunteerProfileId })
    return { ok: true }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ''
    if (/approved/i.test(msg)) {
      try {
        await updateReliefRequestStatus(reliefRequestId, 'Approved')
        await createAssignment({ reliefRequestId, volunteerProfileId })
        return { ok: true }
      } catch (e2: unknown) {
        return { ok: false, message: e2 instanceof Error ? e2.message : msg, statusLocked: true }
      }
    }
    return { ok: false, message: msg || t('admin.assign_failed'), statusLocked: false }
  }
}

async function assignVolunteer(vol: SuggestedVolunteer) {
  if (!detail.value || isFullyAllocated.value) return
  isAssigning.value = true
  assigningId.value = vol.volunteerProfileId
  assignMsg.value = ''
  const result = await assignOneVolunteer(vol.volunteerProfileId)
  if (result.ok) {
    assignMsg.value = `Đã phân công ${vol.fullName} thành công!`
    assignMsgType.value = 'ok'
    allocatedCount.value += 1
    // Không set detail.value.status = 'Assigned' ở đây: khối gợi ý chỉ hiện khi status
    // === 'Approved', set ngay sẽ làm danh sách/tiến độ biến mất giữa chừng trong khi
    // admin còn đang phân bổ tiếp cho đủ targetHeadcount. Chỉ làm mới ngầm bảng danh
    // sách phía sau; trạng thái thật cập nhật khi đóng/mở lại modal.
    getReliefRequests(1, 200)
      .then((list) => { allRequests.value = list })
      .catch(() => { /* làm mới ngầm — lỗi không quan trọng, bỏ qua */ })
  } else {
    assignMsg.value = result.statusLocked ? t('admin.assign_status_locked_note') : result.message
    assignMsgType.value = 'error'
  }
  isAssigning.value = false
  assigningId.value = null
}

async function loadAllVolunteersForSearch() {
  isLoadingAllVolunteers.value = true
  try {
    allVolunteersForSearch.value = await getAdminVolunteers()
  } catch (e) {
    console.error(e)
  } finally {
    isLoadingAllVolunteers.value = false
  }
}

async function assignSearchedVolunteer(v: VolunteerSummary) {
  if (!detail.value || isFullyAllocated.value) return
  isAssigning.value = true
  assigningId.value = v.id
  assignMsg.value = ''
  const result = await assignOneVolunteer(v.id)
  if (result.ok) {
    assignMsg.value = `Đã phân công ${v.fullName} thành công!`
    assignMsgType.value = 'ok'
    allocatedCount.value += 1
    loadTeam(detail.value.id)
    getReliefRequests(1, 200)
      .then((list) => { allRequests.value = list })
      .catch(() => { /* làm mới ngầm — lỗi không quan trọng, bỏ qua */ })
  } else {
    assignMsg.value = result.statusLocked ? t('admin.assign_status_locked_note') : result.message
    assignMsgType.value = 'error'
  }
  isAssigning.value = false
  assigningId.value = null
}

// Mở modal ở chế độ "team" — chỉ hiện phần liên quan TNV/phân công (ẩn thông tin liên hệ,
// địa điểm, mô tả, đổi trạng thái) — không điều hướng sang trang khác nữa (trước đây nhảy
// sang /admin/assignments, tốn 1 lượt chuyển trang).
function goToTeamManagement(reliefRequestId: string) {
  openDetail(reliefRequestId, 'team')
}

// PHẦN C — phân công N người đầu (đã sắp theo gần nhất/phù hợp nhất) làm đội tối thiểu.
// Gọi TUẦN TỰ (không song song) để tránh nhiều request cùng lúc đua nhau vượt quá
// TargetHeadcount ở BE (BE check "đã đủ người" theo từng lần gọi, không có lock riêng
// cho việc gọi hàng loạt). Không tự bầu đội trưởng — admin bầu tay ở "Quản lý đội".
async function autoAssignTeam() {
  if (!detail.value || isFullyAllocated.value) return

  // Tự tính số người còn thiếu so với targetHeadcount — không cho admin tự gõ số nữa,
  // tránh lệch với số đã duyệt ở bước "Chi tiết yêu cầu".
  const requested = Math.max(1, targetHeadcountValue.value - allocatedCount.value)
  const candidates = suggestedVolunteers.value.slice(0, requested)

  isAutoAssigning.value = true
  autoAssignResults.value = []
  autoAssignSummary.value = ''

  const results: AutoAssignResult[] = []
  let statusLockedStop = false
  for (const vol of candidates) {
    const result = await assignOneVolunteer(vol.volunteerProfileId)
    if (result.ok) {
      results.push({ volunteerProfileId: vol.volunteerProfileId, fullName: vol.fullName, ok: true, message: '' })
    } else {
      results.push({ volunteerProfileId: vol.volunteerProfileId, fullName: vol.fullName, ok: false, message: result.message })
      // Yêu cầu đã rời trạng thái Approved và không tự khôi phục được — mọi người còn lại trong
      // đợt này chắc chắn sẽ lỗi y hệt, dừng ngay để khỏi spam lỗi lặp lại cho từng người.
      if (result.statusLocked) {
        statusLockedStop = true
        break
      }
    }
    // Cập nhật dần từng dòng để admin thấy tiến trình, không đợi hết cả vòng lặp.
    autoAssignResults.value = [...results]
  }
  autoAssignResults.value = [...results]

  const successCount = results.filter(r => r.ok).length
  if (statusLockedStop) {
    autoAssignSummary.value = t('admin.auto_assign_status_locked_summary', { success: successCount })
  } else {
    autoAssignSummary.value = candidates.length < requested
      ? t('admin.auto_assign_summary_partial', { available: candidates.length, requested, success: successCount })
      : t('admin.auto_assign_summary', { success: successCount, total: candidates.length })
  }

  allocatedCount.value += successCount
  isAutoAssigning.value = false

  // Không đụng detail.value/suggestedVolunteers ở đây — giữ nguyên khối "Approved" đang mở để
  // admin đọc được kết quả từng người; chỉ làm mới ngầm bảng danh sách phía sau cho lần xem sau.
  if (successCount > 0) {
    getReliefRequests(1, 200)
      .then((list) => { allRequests.value = list })
      .catch(() => { /* làm mới ngầm — lỗi không quan trọng, bỏ qua */ })
  }
}
</script>

<style scoped>
/* ── Page ─────────────────────────────────────────────────── */
.rrm-page { max-width: 1200px; }

/* ── Header ──────────────────────────────────────────────── */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 20px;
}
.role-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(197,48,48,0.09);
  color: #c53030;
  font-size: 11.5px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 99px;
  margin-bottom: 10px;
}
.page-title {
  font-size: 26px;
  font-weight: 800;
  color: #1a3b5c;
  letter-spacing: -0.5px;
  line-height: 1.2;
}
.page-sub { font-size: 13.5px; color: #718096; margin-top: 4px; }

.header-stats {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}
.hstat {
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 12px;
  padding: 12px 18px;
  text-align: center;
  box-shadow: 0 1px 6px rgba(0,0,0,0.05);
  border-top: 3px solid var(--hs-color);
  min-width: 80px;
}
.hstat__val   { display: block; font-size: 24px; font-weight: 900; color: #1a2d3d; }
.hstat__label { display: block; font-size: 10.5px; color: #718096; font-weight: 600; margin-top: 2px; }

/* ── Filters ─────────────────────────────────────────────── */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}
.search-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 10px;
  padding: 8px 14px;
  min-width: 220px;
  color: #9ca3af;
}
.search-input {
  border: none;
  outline: none;
  font-size: 13px;
  color: #2d3748;
  width: 100%;
  background: transparent;
}
.status-filters {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  flex: 1;
}
.status-filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 99px;
  border: 1.5px solid #e9ecef;
  background: #fff;
  font-size: 12px;
  font-weight: 600;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}
.status-filter-btn.active {
  background: var(--af-bg);
  color: var(--af-color);
  border-color: transparent;
}
.status-filter-btn:hover:not(.active) { background: #f8fafc; }
.filter-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.filter-count {
  background: rgba(0,0,0,0.08);
  border-radius: 99px;
  padding: 0 6px;
  font-size: 10px;
  font-weight: 700;
}
.sort-select {
  padding: 8px 12px;
  border: 1.5px solid #e9ecef;
  border-radius: 10px;
  font-size: 13px;
  color: #2d3748;
  background: #fff;
  cursor: pointer;
  outline: none;
}

/* ── Table ───────────────────────────────────────────────── */
.table-card {
  background: #fff;
  border-radius: 16px;
  border: 1px solid #e9ecef;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  overflow: hidden;
}
.admin-pagination {
  display: flex; align-items: center; justify-content: center; gap: 16px;
  padding: 14px; border-top: 1px solid #e9ecef;
}
.page-btn {
  padding: 7px 16px; border-radius: 8px; border: 1.5px solid #e2e8f0; background: #fff;
  font-size: 13px; font-weight: 600; cursor: pointer; color: #1a4f8d; transition: all 0.15s ease;
}
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-btn:not(:disabled):hover { border-color: #1a4f8d; background: rgba(26,79,141,0.05); }
.page-info { font-size: 13px; color: #718096; }
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th {
  background: #f8fafc;
  padding: 13px 16px;
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  border-bottom: 1px solid #e9ecef;
  text-align: left;
}
.th-center { text-align: center !important; }
.data-row {
  cursor: pointer;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.15s ease;
}
.data-row:hover { background: #f8fafc; }
.data-row td { padding: 13px 16px; font-size: 13px; color: #2d3748; vertical-align: middle; }

.td-title { max-width: 220px; }
.title-text { display: block; font-weight: 600; color: #1a3b5c; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.affect-info { font-size: 11px; color: #a0aec0; margin-top: 2px; display: block; }

.td-address { max-width: 180px; font-size: 12.5px; color: #4a5568; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.td-date { font-size: 12px; color: #718096; white-space: nowrap; }

/* Emergency badge */
.emergency-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 700;
}
.elv-1 { background: #dcfce7; color: #15803d; }
.elv-2 { background: #fef9c3; color: #854d0e; }
.elv-3 { background: #ffedd5; color: #9a3412; }
.elv-4 { background: #fee2e2; color: #991b1b; }

/* Status badge */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 99px;
  font-size: 11.5px;
  font-weight: 700;
  white-space: nowrap;
}
.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Needs */
.needs-icons { display: flex; gap: 3px; justify-content: center; flex-wrap: wrap; }
.need-chip { font-size: 16px; }

/* Buttons */
.action-btn {
  padding: 6px 14px;
  border-radius: var(--radius-md, 8px);
  font-size: 12.5px;
  font-weight: 600;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}
.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0,0,0,0.08);
}
.action-btn:active { transform: translateY(0); }
.action-btn--details {
  background-color: #f1f5f9;
  border-color: #e2e8f0;
  color: #1d4ed8;
}
.action-btn--details:hover {
  background-color: #e2e8f0;
  border-color: #cbd5e1;
  color: #1e40af;
}
.row-actions { display: inline-flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
.action-btn--team {
  background-color: #fef9c3;
  border-color: #fde68a;
  color: #854d0e;
}
.action-btn--team:hover {
  background-color: #fde68a;
  border-color: #fcd34d;
  color: #713f12;
}

/* Loading / Empty */
.loading-state, .empty-state {
  padding: 60px 20px;
  text-align: center;
  color: #a0aec0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}
.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #e9ecef;
  border-top-color: #c53030;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Modal ───────────────────────────────────────────────── */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(10,18,35,0.6);
  backdrop-filter: blur(4px);
  z-index: 500;
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.modal-box {
  width: 620px; max-width: 100%;
  max-height: 90vh;
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  display: flex; flex-direction: column;
  box-shadow: 0 24px 80px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.06);
}

/* Header */
.modal-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 20px 24px 18px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%);
  flex-shrink: 0;
}
.modal-subtitle { font-size: 10.5px; color: rgba(255,255,255,0.45); font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 5px; }
.modal-title    { font-size: 16px; font-weight: 800; color: #fff; line-height: 1.35; max-width: 480px; }
.modal-close {
  width: 32px; height: 32px; border-radius: 8px;
  background: rgba(255,255,255,0.1); border: none;
  color: rgba(255,255,255,0.65); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-left: 12px;
  transition: all 0.15s ease;
}
.modal-close:hover { background: rgba(255,255,255,0.2); color: #fff; }

/* Loading */
.modal-loading { padding: 60px 24px; display: flex; flex-direction: column; align-items: center; gap: 12px; color: #a0aec0; }

/* Scrollable body */
.modal-body { overflow-y: auto; flex: 1; padding: 16px 24px 24px; display: flex; flex-direction: column; gap: 16px; }

/* Badge row */
.modal-badge-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

/* Info cards */
.modal-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.info-card { background: #f8fafc; border: 1px solid #e9ecef; border-radius: 12px; padding: 14px 16px; }
.info-card__header {
  display: flex; align-items: center; gap: 7px;
  font-size: 11px; font-weight: 800; color: #475569;
  text-transform: uppercase; letter-spacing: 0.5px;
  margin-bottom: 12px; padding-bottom: 10px;
  border-bottom: 1px solid #e9ecef;
}
.info-card__sublabel { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 4px; }
.info-card__val { font-size: 13px; font-weight: 700; color: #1a3b5c; line-height: 1.4; }
.info-card__val--small { font-size: 11.5px; font-weight: 500; color: #64748b; }
.info-card__datebox { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 7px 11px; font-size: 12.5px; font-weight: 600; color: #334155; }

/* Modal sections */
.modal-section { display: flex; flex-direction: column; gap: 8px; padding-top: 4px; border-top: 1px solid #f1f5f9; padding-top: 14px; }
.modal-section__label { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
.modal-section__text { font-size: 13.5px; color: #374151; line-height: 1.6; background: #f8fafc; border-radius: 10px; padding: 12px 14px; border: 1px solid #e9ecef; }

/* kept for compatibility */
.section-block { padding: 0; border-bottom: none; }
.section-label { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 12px; }

/* Needs tags */
.needs-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.need-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 99px;
  background: #f0f9f4;
  border: 1px solid #c6f6d5;
  color: #276749;
  font-size: 12.5px;
  font-weight: 600;
}
.need-tag--none { background: #f8fafc; border-color: #e9ecef; color: #a0aec0; }

/* Status inputs (note / target headcount) */
.status-inputs { display: flex; flex-direction: column; gap: 10px; margin-bottom: 12px; }
.status-input-field { display: flex; flex-direction: column; gap: 4px; font-size: 12.5px; font-weight: 600; color: #4a5568; }
.status-input-hint { font-size: 11.5px; font-weight: 500; color: #a0aec0; }
.required-mark { color: #e53e3e; margin-left: 2px; }
.status-input-field input,
.status-input-field textarea {
  font: inherit;
  font-weight: 400;
  padding: 7px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  resize: vertical;
}
.status-input-field input { width: 140px; }

/* Status flow */
.status-flow { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
.flow-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border-radius: 8px;
  border: 1px solid transparent;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.flow-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
}
.flow-btn:active { transform: translateY(0); }
.flow-btn--approved   { background: #ecfdf5; border-color: #a7f3d0; color: #065f46; }
.flow-btn--approved:hover   { background: #d1fae5; border-color: #6ee7b7; }
.flow-btn--cancelled  { background: #fef2f2; border-color: #fca5a5; color: #991b1b; }
.flow-btn--cancelled:hover  { background: #fee2e2; border-color: #f87171; }
.flow-btn--inprogress { background: #f5f3ff; border-color: #c4b5fd; color: #6d28d9; }
.flow-btn--inprogress:hover { background: #ede9fe; border-color: #a78bfa; }
.flow-btn--completed  { background: #ecfdf5; border-color: #6ee7b7; color: #065f46; }
.flow-btn--completed:hover  { background: #d1fae5; border-color: #34d399; }
.flow-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }
.flow-none { font-size: 13px; color: #a0aec0; font-style: italic; }
.status-msg { font-size: 12.5px; padding: 8px 12px; border-radius: 8px; margin-top: 8px; }
.msg--ok    { background: #dcfce7; color: #15803d; }
.msg--error { background: #fee2e2; color: #991b1b; }

.inventory-issues { margin-top: 10px; padding: 10px 12px; border-radius: 8px; background: #f8fafc; border: 1px solid #e2e8f0; }
.inventory-issues__title { font-size: 12px; font-weight: 700; color: #334155; margin: 0 0 6px 0; }
.inventory-issues__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.inventory-issues__item { font-size: 12.5px; color: #334155; }
.inventory-issues__category { font-weight: 600; }
.inventory-issues__item--short { color: #b45309; }
.inventory-issues__warning { font-weight: 600; color: #b45309; }

/* Suggested volunteers */
.suggested-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; }
.suggested-header .section-label { margin-bottom: 0; }
.suggested-header__right { display: flex; align-items: center; gap: 10px; }
.allocate-progress {
  font-size: 12px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 99px;
  background: #eff6ff;
  color: #1d4ed8;
  white-space: nowrap;
}
.allocate-progress--full { background: #dcfce7; color: #15803d; }
.allocate-full-note {
  font-size: 12.5px;
  font-weight: 600;
  color: #15803d;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 8px;
  padding: 8px 12px;
  margin: 0 0 10px;
}
.fallback-note {
  font-size: 12.5px;
  color: #92400e;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 8px 12px;
  margin: 0 0 10px;
}
.suggest-loading, .suggest-empty {
  padding: 24px;
  text-align: center;
  color: #a0aec0;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

/* Tìm TNV khác — không giới hạn ở danh sách gợi ý lân cận */
.vol-search-block { margin-top: 14px; padding-top: 14px; border-top: 1px dashed #e9ecef; }
.vol-search-wrap {
  display: flex; align-items: center; gap: 8px;
  background: #fff; border: 1px solid #e9ecef; border-radius: 10px;
  padding: 8px 14px; color: #9ca3af; max-width: 360px;
}
.vol-search-input { border: none; outline: none; font-size: 13px; color: #2d3748; width: 100%; background: transparent; }
.vol-search-results { margin-top: 10px; }

/* Đội tình nguyện đã gán (khu vực gộp trực tiếp vào modal, thay cho trang riêng) */
.team-rows { display: flex; flex-direction: column; gap: 8px; }
.team-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e9ecef;
}
.team-row__main { display: flex; align-items: center; gap: 12px; min-width: 0; }
.team-row__info { min-width: 0; }
.team-row__name { display: flex; align-items: center; gap: 6px; font-size: 13.5px; font-weight: 700; color: #1a3b5c; margin: 0; }
.lead-icon { color: #eab308; flex-shrink: 0; }
.asn-status-badge { display: inline-block; margin-top: 4px; padding: 2px 9px; border-radius: 99px; font-size: 11px; font-weight: 700; }
.cancel-flag { display: inline-block; margin-top: 4px; margin-left: 6px; padding: 2px 9px; border-radius: 99px; font-size: 11px; font-weight: 700; background: #fee2e2; color: #991b1b; }
.team-row__actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.btn-team-lead, .btn-remove-team-lead, .btn-cancel-row {
  padding: 5px 11px; border-radius: 7px; border: none; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s ease;
}
.btn-team-lead { background: #fef9c3; color: #854d0e; }
.btn-team-lead:hover:not(:disabled) { background: #eab308; color: #fff; }
.btn-team-lead:disabled { opacity: 0.45; cursor: not-allowed; }
.btn-remove-team-lead { background: #f1f5f9; color: #475569; }
.btn-remove-team-lead:hover:not(:disabled) { background: #e2e8f0; }
.btn-remove-team-lead:disabled { opacity: 0.45; cursor: not-allowed; }
.btn-cancel-row { background: transparent; color: #c53030; border: 1px solid #fecaca; }
.btn-cancel-row:hover { background: #fef2f2; }
.team-row__cancel-box { width: 100%; display: flex; gap: 6px; margin-top: 4px; }
.cancel-reason-input { flex: 1; min-width: 120px; padding: 6px 10px; border-radius: 7px; border: 1px solid #e2e8f0; font-size: 12.5px; }
.btn-cancel-confirm { padding: 5px 11px; border-radius: 7px; border: none; background: #c53030; color: #fff; font-size: 12px; font-weight: 600; cursor: pointer; }
.btn-cancel-confirm:disabled { opacity: 0.45; cursor: not-allowed; }
.btn-cancel-dismiss { padding: 5px 11px; border-radius: 7px; border: 1px solid #e2e8f0; background: #fff; color: #475569; font-size: 12px; font-weight: 600; cursor: pointer; }

.volunteer-cards { display: flex; flex-direction: column; gap: 10px; }
.vol-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e9ecef;
  transition: border-color 0.15s ease;
}
.vol-card:hover { border-color: #93c5fd; }
.vol-card__avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #c53030, #e53e3e);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 800;
  flex-shrink: 0;
}
.vol-card__info { flex: 1; min-width: 0; }
.vol-card__name  { font-size: 13.5px; font-weight: 700; color: #1a3b5c; }
.vol-card__email { font-size: 11.5px; color: #a0aec0; margin-top: 1px; }
.vol-card__tags  { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 6px; }
.vol-tag {
  padding: 2px 8px;
  border-radius: 99px;
  background: #e9ecef;
  color: #4a5568;
  font-size: 10.5px;
  font-weight: 600;
}
.vol-tag--dist  { background: rgba(197,48,48,0.1); color: #c53030; display: inline-flex; align-items: center; gap: 3px; }
.vol-tag--exp   { background: rgba(29,78,216,0.1); color: #1d4ed8; }
.vol-tag--more  { background: #1a3b5c; color: #fff; }

/* Tự động phân công đội tối thiểu */
.auto-assign-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px 14px;
  margin-bottom: 10px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
}
.btn-auto-assign {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  background: #1d4ed8;
  border: 1px solid #1d4ed8;
  color: #fff;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}
.btn-auto-assign:hover:not(:disabled) { background: #1e40af; }
.btn-auto-assign:disabled { opacity: 0.5; cursor: not-allowed; }

.auto-assign-results { margin-bottom: 10px; display: flex; flex-direction: column; gap: 6px; }
.auto-assign-summary { font-size: 12.5px; font-weight: 700; color: #1e3a5f; margin: 0 0 2px; }
.auto-assign-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  border-radius: 8px;
  font-size: 12.5px;
}
.auto-assign-row--ok    { background: #ecfdf5; color: #065f46; }
.auto-assign-row--error { background: #fef2f2; color: #991b1b; }
.auto-assign-row__name  { font-weight: 700; flex-shrink: 0; }
.auto-assign-row__msg   { color: inherit; opacity: 0.85; }

.btn-assign {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 14px;
  border-radius: 8px;
  background-color: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #065f46;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;
}
.btn-assign:hover:not(:disabled) { background-color: #d1fae5; border-color: #6ee7b7; transform: translateY(-1px); box-shadow: 0 2px 5px rgba(0,0,0,0.06); }
.btn-assign:disabled { opacity: 0.5; cursor: not-allowed; }

/* Spin icon */
.spin-icon { animation: spin 0.7s linear infinite; }

/* Transition */
.modal-enter-active, .modal-leave-active { transition: opacity 0.22s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.modal-enter-active .modal-box { transition: transform 0.28s cubic-bezier(0.34,1.56,0.64,1), opacity 0.22s ease; }
.modal-enter-from .modal-box { transform: scale(0.9) translateY(20px); opacity: 0; }
.modal-leave-to .modal-box   { transform: scale(0.95) translateY(10px); opacity: 0; }

/* ── Responsive ──────────────────────────────────────────── */
@media (max-width: 900px) {
  .page-header { flex-direction: column; }
  .header-stats { flex-wrap: wrap; }
  .filter-bar { flex-direction: column; align-items: stretch; }
  .status-filters { overflow-x: auto; flex-wrap: nowrap; }
  .data-table th:nth-child(4), .data-table td:nth-child(4) { display: none; }
}
</style>
