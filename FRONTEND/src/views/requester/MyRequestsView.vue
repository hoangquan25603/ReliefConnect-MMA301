<template>
  <RequesterLayout>
    <div class="my-requests-page">

      <div class="page-header">
        <div>
          <h2>{{ $t('requester.my_requests_title') }}</h2>
          <p class="subtitle">{{ $t('requester.my_requests_sub') }}</p>
        </div>
        <button class="btn-primary" @click="openCreateModal">
          {{ $t('requester.create_new') }}
        </button>
      </div>

      <!-- Bộ lọc trạng thái -->
      <div class="filter-bar">
        <button
          v-for="tab in filterTabs"
          :key="tab.value"
          :class="['filter-tab', { active: activeFilter === tab.value }]"
          :style="activeFilter === tab.value ? tab.activeStyle : undefined"
          @click="activeFilter = tab.value"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Danh sách -->
      <div class="card">
        <div v-if="isLoading" class="empty-state">{{ $t('common.loading') }}</div>
        <div v-else-if="loadError" class="empty-state" role="alert">{{ loadError }} <button class="btn-outline" @click="loadRequests">Thử lại</button></div>
        <div v-else-if="filteredRequests.length === 0" class="empty-state">
          {{ $t('requester.no_matching_requests') }}
        </div>

        <div class="request-list" v-else>
          <div class="request-item" v-for="item in filteredRequests" :key="item.id">
            <div class="req-info">
              <div class="req-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>
              </div>
              <div>
                <h4>{{ item.title }}</h4>
                <span class="time">{{ formatDateTimeVI(item.createdAt) }}</span>
              </div>
            </div>
            <div class="req-actions">
              <span class="badge" :style="badgeStyle(item.status)">{{ statusLabel(item.status) }}</span>
              <button class="btn-outline" @click="openQrModal(item)">📱 Mã QR</button>
              <button class="btn-outline" @click="openVoucherModal(item)">📄 Phiếu</button>
              <button class="btn-outline" @click="openDetailModal(item)">{{ $t('requester.view_detail') }}</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════ MODAL: TẠO YÊU CẦU MỚI (WIZARD 3 BƯỚC) ══════════ -->
      <div v-if="showCreateModal" class="modal-overlay" @click.self="closeCreateModal">
        <div class="modal-box create-modal-box">
          <!-- Modal Header -->
          <div class="modal-header">
            <div>
              <h3>{{ $t('requester.modal_create_title') }}</h3>
              <p class="modal-subtitle">Hoàn thành 3 bước đơn giản để gửi yêu cầu hỗ trợ khẩn cấp</p>
            </div>
            <button class="modal-close" @click="closeCreateModal">✕</button>
          </div>

          <!-- Wizard Progress Bar -->
          <div class="wizard-stepper">
            <div
              v-for="stepNum in 3"
              :key="stepNum"
              :class="['step-item', { active: currentStep === stepNum, completed: currentStep > stepNum }]"
              @click="goToStep(stepNum)"
            >
              <div class="step-circle">
                <svg v-if="currentStep > stepNum" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                <span v-else>{{ stepNum }}</span>
              </div>
              <span class="step-title">
                {{ stepNum === 1 ? '1. Thông tin chung' : stepNum === 2 ? '2. Vị trí & Bản đồ' : '3. Nhu cầu vật tư' }}
              </span>
              <div v-if="stepNum < 3" class="step-line"></div>
            </div>
          </div>

          <form class="modal-body wizard-body" @submit.prevent="handleCreateSubmit">
            <!-- ── BƯỚC 1: THÔNG TIN CHUNG ── -->
            <div v-show="currentStep === 1" class="wizard-step-pane">
              <!-- SMART SOS PARSER BOX -->
              <div class="sos-parser-card">
                <div class="sos-parser-header">
                  <span class="sos-icon">⚡</span>
                  <div>
                    <strong>Nhập nhanh từ tin nhắn kêu cứu (SOS Parser)</strong>
                    <p>Dán nội dung tin nhắn kêu cứu từ Zalo/Facebook/SMS để tự động điền tiêu đề, địa chỉ, số người, mức độ khẩn cấp và nhu cầu vật tư.</p>
                  </div>
                </div>
                <textarea
                  v-model="sosInput"
                  class="sos-textarea"
                  rows="3"
                  placeholder="Dán tin nhắn tại đây, VD: Cứu hộ khẩn cấp! Nhà 4 người tại số 12 đường Trưng Nữ Vương, Đà Nẵng, nước ngập sâu. Cần 5 thùng mì tôm, 10 bình nước sạch gấp. SĐT 0905123456"
                ></textarea>
                <div class="sos-actions">
                  <button type="button" class="btn-sample" @click="setSampleSos(1)">Mẫu ngập sâu Đà Nẵng</button>
                  <button type="button" class="btn-sample" @click="setSampleSos(2)">Mẫu cô lập Quảng Nam</button>
                  <button type="button" class="btn-parse" :disabled="!sosInput.trim()" @click="parseAndFillForm">
                    ⚡ Trích xuất & Tự động điền
                  </button>
                </div>
                <div v-if="sosSummary" class="sos-summary-alert">
                  {{ sosSummary }}
                </div>
              </div>

              <div class="form-group">
                <label>Tiêu đề yêu cầu <span class="required">*</span></label>
                <input
                  v-model="form.title"
                  type="text"
                  placeholder="VD: Cần cứu trợ lương thực khẩn cấp cho 5 hộ dân ngập sâu"
                  required
                />
              </div>

              <div class="form-group">
                <label>Mức độ khẩn cấp <span class="required">*</span></label>
                <div class="emergency-cards">
                  <div
                    :class="['emergency-card', 'level-low', { selected: form.emergencyLevel === 1 }]"
                    @click="form.emergencyLevel = 1"
                  >
                    <div class="card-icon">🟢</div>
                    <div class="card-text">
                      <strong>Cần hỗ trợ thường</strong>
                      <span>Sinh hoạt tạm thời, chưa nguy hiểm tính mạng</span>
                    </div>
                  </div>

                  <div
                    :class="['emergency-card', 'level-medium', { selected: form.emergencyLevel === 2 }]"
                    @click="form.emergencyLevel = 2"
                  >
                    <div class="card-icon">🟠</div>
                    <div class="card-text">
                      <strong>Quy mô vừa / Cần gấp</strong>
                      <span>Ngập lụt, cô lập nhẹ, thiếu lương thực 1-2 ngày</span>
                    </div>
                  </div>

                  <div
                    :class="['emergency-card', 'level-high', { selected: form.emergencyLevel === 3 }]"
                    @click="form.emergencyLevel = 3"
                  >
                    <div class="card-icon">🔴</div>
                    <div class="card-text">
                      <strong>Rất nghiêm trọng / Khẩn cấp</strong>
                      <span>Cứu hộ tính mạng, sạt lở, cạn kiệt thức ăn/y tế</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group half">
                  <label>Số người ảnh hưởng <span class="required">*</span></label>
                  <div class="input-with-suffix">
                    <input v-model.number="form.affectedPeople" type="number" min="1" required />
                    <span class="input-suffix">người</span>
                  </div>
                </div>

                <div class="form-group half">
                  <label>Số điện thoại liên hệ <span class="required">*</span></label>
                  <input
                    v-model="form.contactPhone"
                    type="tel"
                    placeholder="VD: 0912345678"
                    required
                  />
                </div>
              </div>

              <div class="form-group">
                <label>Mô tả chi tiết tình hình <span class="required">*</span></label>
                <textarea
                  v-model="form.description"
                  rows="3"
                  placeholder="Mô tả cụ thể hoàn cảnh hiện tại, đường vào có bị ngập không, người già/trẻ em..."
                  required
                ></textarea>
              </div>
            </div>

            <!-- ── BƯỚC 2: VỊ TRÍ & BẢN ĐỒ ── -->
            <div v-show="currentStep === 2" class="wizard-step-pane">
              <div class="form-row">
                <div class="form-group half">
                  <label>Tỉnh / Thành phố <span class="required">*</span></label>
                  <select v-model="form.region" @change="onProvinceSelectChange" required class="form-select">
                    <option v-for="prov in provinceOptions" :key="prov" :value="prov">
                      {{ prov }}
                    </option>
                  </select>
                </div>

                <div class="form-group half">
                  <label>Địa chỉ chi tiết (Thôn/Xóm/Số nhà) <span class="required">*</span></label>
                  <input
                    v-model="form.address"
                    type="text"
                    placeholder="VD: Số 12, Thôn A, Xã B, Huyện C"
                    required
                  />
                </div>
              </div>

              <div class="form-group map-section">
                <div class="map-header">
                  <label>Ghim vị trí chính xác trên bản đồ</label>
                  <button type="button" class="btn-geo-compact" @click="useCurrentLocation">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/><circle cx="12" cy="12" r="7"/></svg>
                    Lấy vị trí của tôi
                  </button>
                </div>
                <div class="map-container-wrapper">
                  <div ref="mapElRef" class="request-map"></div>
                  <div v-if="isGeocoding" class="map-suggestion map-suggestion--loading">
                    <span class="spinner-dot"></span> Đang nhận diện địa chỉ từ bản đồ...
                  </div>
                  <div v-else-if="suggestedAddressText" class="map-suggestion map-suggestion--done">
                    <div class="suggestion-text">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>
                      <span>Đã tự động điền: {{ suggestedAddressText }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="form-row coords-preview">
                <div class="form-group half">
                  <label>Vĩ độ (Latitude)</label>
                  <input v-model.number="form.latitude" type="number" step="any" readonly class="input-readonly" />
                </div>
                <div class="form-group half">
                  <label>Kinh độ (Longitude)</label>
                  <input v-model.number="form.longitude" type="number" step="any" readonly class="input-readonly" />
                </div>
              </div>
            </div>

            <!-- ── BƯỚC 3: NHU CẦU VẬT TƯ CỨU TRỢ ── -->
            <div v-show="currentStep === 3" class="wizard-step-pane">
              <div class="form-group">
                <label>Chọn các loại nhu yếu phẩm cần hỗ trợ</label>
                <p class="form-hint">Tích chọn loại vật tư cần và nhập số lượng ước tính (nếu biết)</p>

                <div class="needs-grid">
                  <!-- Thức ăn -->
                  <div :class="['need-card', { active: form.needFood }]">
                    <div class="need-card-header" @click="form.needFood = !form.needFood; if (!form.needFood) form.foodQuantity = null">
                      <div class="need-checkbox">
                        <input type="checkbox" v-model="form.needFood" @click.stop />
                      </div>
                      <span class="need-icon">🍚</span>
                      <div class="need-info">
                        <strong>Lương thực / Thực phẩm</strong>
                        <span>Gạo, mì tôm, đồ hộp, lương khô...</span>
                      </div>
                    </div>
                    <div v-if="form.needFood" class="need-card-body">
                      <label>Số lượng cần:</label>
                      <div class="input-with-suffix">
                        <input v-model.number="form.foodQuantity" type="number" min="1" placeholder="VD: 10" />
                        <span class="input-suffix">suất / kg</span>
                      </div>
                    </div>
                  </div>

                  <!-- Nước uống -->
                  <div :class="['need-card', { active: form.needWater }]">
                    <div class="need-card-header" @click="form.needWater = !form.needWater; if (!form.needWater) form.waterQuantity = null">
                      <div class="need-checkbox">
                        <input type="checkbox" v-model="form.needWater" @click.stop />
                      </div>
                      <span class="need-icon">💧</span>
                      <div class="need-info">
                        <strong>Nước uống sạch</strong>
                        <span>Nước đóng chai, bình nước lọc...</span>
                      </div>
                    </div>
                    <div v-if="form.needWater" class="need-card-body">
                      <label>Số lượng cần:</label>
                      <div class="input-with-suffix">
                        <input v-model.number="form.waterQuantity" type="number" min="1" placeholder="VD: 5" />
                        <span class="input-suffix">thùng / lốc</span>
                      </div>
                    </div>
                  </div>

                  <!-- Thuốc men -->
                  <div :class="['need-card', { active: form.needMedicine }]">
                    <div class="need-card-header" @click="form.needMedicine = !form.needMedicine; if (!form.needMedicine) form.medicineQuantity = null">
                      <div class="need-checkbox">
                        <input type="checkbox" v-model="form.needMedicine" @click.stop />
                      </div>
                      <span class="need-icon">💊</span>
                      <div class="need-info">
                        <strong>Thuốc & Y tế</strong>
                        <span>Thuốc cảm, bông băng, sát trùng...</span>
                      </div>
                    </div>
                    <div v-if="form.needMedicine" class="need-card-body">
                      <label>Số lượng cần:</label>
                      <div class="input-with-suffix">
                        <input v-model.number="form.medicineQuantity" type="number" min="1" placeholder="VD: 2" />
                        <span class="input-suffix">bộ / cơ số</span>
                      </div>
                    </div>
                  </div>

                  <!-- Chăn mền -->
                  <div :class="['need-card', { active: form.needBlanket }]">
                    <div class="need-card-header" @click="form.needBlanket = !form.needBlanket; if (!form.needBlanket) form.blanketQuantity = null">
                      <div class="need-checkbox">
                        <input type="checkbox" v-model="form.needBlanket" @click.stop />
                      </div>
                      <span class="need-icon">🛏️</span>
                      <div class="need-info">
                        <strong>Chăn mền / Áo ấm</strong>
                        <span>Chăn ấm, áo mưa, quần áo...</span>
                      </div>
                    </div>
                    <div v-if="form.needBlanket" class="need-card-body">
                      <label>Số lượng cần:</label>
                      <div class="input-with-suffix">
                        <input v-model.number="form.blanketQuantity" type="number" min="1" placeholder="VD: 4" />
                        <span class="input-suffix">cái / chiếc</span>
                      </div>
                    </div>
                  </div>

                  <!-- Nơi trú ẩn -->
                  <div :class="['need-card', { active: form.needShelter }]">
                    <div class="need-card-header" @click="form.needShelter = !form.needShelter; if (!form.needShelter) form.shelterQuantity = null">
                      <div class="need-checkbox">
                        <input type="checkbox" v-model="form.needShelter" @click.stop />
                      </div>
                      <span class="need-icon">⛺</span>
                      <div class="need-info">
                        <strong>Nơi trú ẩn / Bạt bạt bạt</strong>
                        <span>Lều bạt, chỗ ở tạm thời...</span>
                      </div>
                    </div>
                    <div v-if="form.needShelter" class="need-card-body">
                      <label>Số lượng cần:</label>
                      <div class="input-with-suffix">
                        <input v-model.number="form.shelterQuantity" type="number" min="1" placeholder="VD: 1" />
                        <span class="input-suffix">bộ / tấm</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <p v-if="createError" class="error-text alert-danger">{{ createError }}</p>

            <!-- Action Navigation Buttons -->
            <div class="modal-actions wizard-actions">
              <button
                v-if="currentStep > 1"
                type="button"
                class="btn-outline"
                @click="currentStep--"
              >
                ← Quay lại
              </button>
              <button
                v-else
                type="button"
                class="btn-outline"
                @click="closeCreateModal"
              >
                Hủy bỏ
              </button>

              <button
                v-if="currentStep < 3"
                type="button"
                class="btn-primary"
                @click="nextStep"
              >
                Tiếp tục →
              </button>
              <button
                v-else
                type="submit"
                class="btn-primary btn-submit-final"
                :disabled="isSubmitting"
              >
                <svg v-if="isSubmitting" class="spinner-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.3"/><path fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
                {{ isSubmitting ? 'Đang gửi yêu cầu...' : '🚀 Gửi Yêu Cầu Cứu Trợ' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- ══════════ MODAL: XEM CHI TIẾT ══════════ -->
      <div v-if="showDetailModal" class="modal-overlay" @click.self="closeDetailModal">
        <div class="modal-box detail-modal" v-if="selectedRequest">
          <div class="modal-header detail-header">
            <div class="detail-header-info">
              <span class="badge" :style="badgeStyle(selectedRequest.status)">
                {{ statusLabel(selectedRequest.status) }}
              </span>
              <h3>{{ selectedRequest.title }}</h3>
            </div>
            <button class="modal-close" @click="closeDetailModal">✕</button>
          </div>

          <div class="modal-body detail-body">
            <div class="detail-grid">
              <div class="detail-field">
                <span class="detail-field__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0 5.4 5.4 0 0 0 0 7.65l8.42 8.42 8.42-8.42a5.4 5.4 0 0 0 0-7.65z" opacity="0" /><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 0 1-2.827 0l-4.244-4.243a8 8 0 1 1 11.314 0z"/><circle cx="12" cy="11" r="3"/></svg>
                </span>
                <div>
                  <span class="detail-field__label">{{ $t('requester.detail_address') }}</span>
                  <span class="detail-field__value">{{ selectedRequest.address }}</span>
                </div>
              </div>

              <div class="detail-field">
                <span class="detail-field__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"/><path d="M8 2v16"/><path d="M16 6v16"/></svg>
                </span>
                <div>
                  <span class="detail-field__label">{{ $t('requester.detail_region') }}</span>
                  <span class="detail-field__value">{{ selectedRequest.region || '—' }}</span>
                </div>
              </div>

              <div class="detail-field">
                <span class="detail-field__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </span>
                <div>
                  <span class="detail-field__label">{{ $t('requester.detail_affected') }}</span>
                  <span class="detail-field__value">{{ selectedRequest.affectedPeople }}</span>
                </div>
              </div>

              <div class="detail-field">
                <span class="detail-field__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </span>
                <div>
                  <span class="detail-field__label">{{ $t('requester.detail_phone') }}</span>
                  <span class="detail-field__value">{{ selectedRequest.contactPhone || '—' }}</span>
                </div>
              </div>

              <div class="detail-field">
                <span class="detail-field__icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </span>
                <div>
                  <span class="detail-field__label">{{ $t('requester.detail_created') }}</span>
                  <span class="detail-field__value">{{ formatDateTimeVI(selectedRequest.createdAt) }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <span class="detail-section__label">{{ $t('requester.detail_description') }}</span>
              <p class="detail-section__text">{{ selectedRequest.description || '—' }}</p>
            </div>

            <div class="detail-section">
              <span class="detail-section__label">{{ $t('requester.detail_needs') }}</span>
              <div class="needs-chips">
                <span v-for="need in selectedNeeds" :key="need" class="need-chip">{{ need }}</span>
                <span v-if="selectedNeeds.length === 0" class="need-chip need-chip--empty">{{ $t('requester.need_none') }}</span>
              </div>
            </div>

            <p v-if="cancelError" class="error-text">{{ cancelError }}</p>

            <div class="modal-actions detail-actions" style="display: flex; gap: 8px; flex-wrap: wrap;">
              <button
                type="button"
                class="btn-outline"
                @click="openQrModal(selectedRequest)"
              >
                📱 Mã QR giao nhận
              </button>
              <button
                type="button"
                class="btn-outline"
                @click="openVoucherModal(selectedRequest)"
              >
                📄 Phiếu bàn giao
              </button>
              <button
                v-if="canCancel(selectedRequest)"
                type="button"
                class="btn-cancel-request"
                :disabled="isCancelling"
                @click="handleCancelRequest(selectedRequest)"
              >
                {{ isCancelling ? $t('requester.cancelling') : $t('requester.cancel_request_btn') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════ MODAL: MÃ QR GIAO NHẬN ══════════ -->
      <div v-if="showQrModal" class="modal-overlay" @click.self="showQrModal = false">
        <div class="modal-box" style="max-width: 420px; text-align: center;">
          <div class="modal-header">
            <h3>📱 Mã QR xác nhận giao nhận</h3>
            <button class="modal-close" @click="showQrModal = false">✕</button>
          </div>
          <div class="modal-body" style="padding: 20px;">
            <p style="margin-bottom: 12px; color: #475569; font-size: 14px;">
              Yêu cầu <strong>#{{ qrModalItem?.id }}</strong> — Đưa mã này cho Tình nguyện viên đối soát khi nhận hàng cứu trợ.
            </p>
            <div style="display: flex; justify-content: center; margin: 16px 0;" v-html="qrSvg"></div>
            <div style="background: #f1f5f9; padding: 8px 16px; border-radius: 8px; font-family: monospace; font-weight: bold; color: #0f172a; display: inline-block;">
              RELIEF:REQ:{{ qrModalItem?.id }}:{{ qrModalItem?.emergencyLevel }}
            </div>
            <div style="margin-top: 20px;">
              <button class="btn-primary" @click="showQrModal = false">Đóng</button>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════ MODAL: BIÊN BẢN / PHIẾU BÀN GIAO ══════════ -->
      <div v-if="showVoucherModal" class="modal-overlay" @click.self="showVoucherModal = false">
        <div class="modal-box" style="max-width: 600px;">
          <div class="modal-header">
            <h3>📄 Phiếu bàn giao vật tư cứu trợ</h3>
            <button class="modal-close" @click="showVoucherModal = false">✕</button>
          </div>
          <div class="modal-body" style="padding: 20px;">
            <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; font-family: monospace; font-size: 12px; line-height: 1.6; white-space: pre-wrap; color: #0f172a; max-height: 380px; overflow-y: auto;">
{{ voucherText }}
            </div>
            <div style="display: flex; gap: 10px; margin-top: 16px; justify-content: flex-end;">
              <button class="btn-outline" @click="copyVoucher">
                {{ copySuccess ? '✓ Đã sao chép!' : '📋 Sao chép nội dung' }}
              </button>
              <button class="btn-outline" @click="printVoucher">
                🖨️ In phiếu
              </button>
              <button class="btn-primary" @click="showVoucherModal = false">
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  </RequesterLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import RequesterLayout from '@/components/layout/RequesterLayout.vue'
import {
  createReliefRequest,
  getReliefRequests,
  cancelReliefRequest,
} from '@/features/requests/requests.api'
import {
  STATUS_GROUP_COLOR,
  type CreateReliefRequestPayload,
  type ReliefRequestResponse,
  type ReliefRequestStatus,
} from '@/features/requests/requests.types'
import {
  badgeStyle,
  formatDateTimeVI,
  matchesRequesterFilterGroup,
  type RequesterFilterGroup,
} from '@/features/requests/requests.helpers'
import { resolveProvinceCenter } from '@/features/requests/vn-provinces'
import { parseSosMessage } from '@/utils/sosParser'
import { generateQrSvg } from '@/utils/qr'
import { formatVoucherText } from '@/utils/voucher'

// Smart SOS Parser State
const sosInput = ref('')
const sosSummary = ref('')

function setSampleSos(type: number) {
  if (type === 1) {
    sosInput.value =
      'Cứu hộ khẩn cấp! Nhà 4 người tại số 12 đường Trưng Nữ Vương, Đà Nẵng, nước ngập sâu ngang ngực, có người già. SĐT liên hệ: 0905123456. Cần 5 thùng mì tôm, 10 bình nước sạch gấp!'
  } else {
    sosInput.value =
      'Khu vực thôn 3, xã Đại Lộc, Quảng Nam bị cô lập do sạt lở. Hộ 6 người thiếu lương thực và thuốc men hạ sốt. LH 0988776655. Cần chăn ấm và gạo.'
  }
}

function parseAndFillForm() {
  if (!sosInput.value.trim()) return
  const parsed = parseSosMessage(sosInput.value)
  form.value.title = parsed.title
  form.value.description = parsed.description
  form.value.emergencyLevel = parsed.emergencyLevel
  form.value.affectedPeople = parseInt(parsed.affectedPeople, 10) || 1
  form.value.contactPhone = parsed.contactPhone || form.value.contactPhone
  if (parsed.address) form.value.address = parsed.address
  if (parsed.region) form.value.region = parsed.region

  if (parsed.region === 'Đà Nẵng') {
    form.value.latitude = 16.0544
    form.value.longitude = 108.2022
  } else if (parsed.region === 'Huế') {
    form.value.latitude = 16.4637
    form.value.longitude = 107.5909
  } else if (parsed.region === 'Quảng Nam') {
    form.value.latitude = 15.8801
    form.value.longitude = 108.338
  }

  form.value.needFood = parsed.needFood
  form.value.foodQuantity = parsed.foodQuantity
  form.value.needWater = parsed.needWater
  form.value.waterQuantity = parsed.waterQuantity
  form.value.needMedicine = parsed.needMedicine
  form.value.medicineQuantity = parsed.medicineQuantity
  form.value.needBlanket = parsed.needBlanket
  form.value.blanketQuantity = parsed.blanketQuantity
  form.value.needShelter = parsed.needShelter
  form.value.shelterQuantity = parsed.shelterQuantity

  sosSummary.value = `✓ Đã nhận diện: ${parsed.summary}`
}

// QR Code and Voucher Modal State
const showQrModal = ref(false)
const qrModalItem = ref<ReliefRequestResponse | null>(null)
const qrSvg = ref('')

function openQrModal(item: ReliefRequestResponse) {
  qrModalItem.value = item
  qrSvg.value = generateQrSvg(`RELIEF:REQ:${item.id}:${item.emergencyLevel}`, 200)
  showQrModal.value = true
}

const showVoucherModal = ref(false)
const voucherItem = ref<ReliefRequestResponse | null>(null)
const voucherText = ref('')
const copySuccess = ref(false)

function openVoucherModal(item: ReliefRequestResponse) {
  voucherItem.value = item
  voucherText.value = formatVoucherText({
    id: item.id,
    title: item.title,
    address: item.address,
    region: item.region,
    contactPhone: item.contactPhone,
    status: item.status,
    affectedPeople: item.affectedPeople,
    emergencyLevel: item.emergencyLevel,
  })
  copySuccess.value = false
  showVoucherModal.value = true
}

async function copyVoucher() {
  try {
    await navigator.clipboard.writeText(voucherText.value)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2500)
  } catch (e) {
    alert('Không thể sao chép: ' + e)
  }
}

function printVoucher() {
  window.print()
}

// Danh sách các Tỉnh/Thành phố chuẩn hóa
const PROVINCES_RAW = [
  'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
  'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu',
  'Bắc Ninh', 'Bến Tre', 'Bình Định', 'Bình Dương', 'Bình Phước',
  'Bình Thuận', 'Cà Mau', 'Cao Bằng', 'Đắk Lắk', 'Đắk Nông',
  'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang',
  'Hà Nam', 'Hà Tĩnh', 'Hải Dương', 'Hậu Giang', 'Hòa Bình',
  'Hưng Yên', 'Khánh Hòa', 'Kiên Giang', 'Kon Tum', 'Lai Châu',
  'Lâm Đồng', 'Lạng Sơn', 'Lào Cai', 'Long An', 'Nam Định',
  'Nghệ An', 'Ninh Bình', 'Ninh Thuận', 'Phú Thọ', 'Phú Yên',
  'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị',
  'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên',
  'Thanh Hóa', 'Thừa Thiên Huế', 'Tiền Giang', 'Trà Vinh', 'Tuyên Quang',
  'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái',
]
const provinceOptions = ref(PROVINCES_RAW)

// Bỏ dấu + chuẩn hoá để so khớp tên tỉnh/thành Nominatim trả về (VD: "Thành
// phố Hà Nội", "Ho Chi Minh City") với đúng chuỗi hiển thị trong dropdown.
// Duyệt theo code point sau NFD thay vì literal regex chứa ký tự dấu tổ hợp
// trong source file (dễ bị lưu sai encoding) — cùng cách vn-provinces.ts dùng.
function normalizeProvinceName(input: string): string {
  let stripped = ''
  for (const ch of input.normalize('NFD')) {
    const code = ch.codePointAt(0) ?? 0
    if (code >= 0x0300 && code <= 0x036f) continue
    stripped += ch
  }
  return stripped
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/^(tp\.?|thanh pho|tinh)\s+/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function matchProvinceOption(rawRegion: string): string | null {
  const norm = normalizeProvinceName(rawRegion)
  if (!norm) return null
  return (
    provinceOptions.value.find((p) => normalizeProvinceName(p) === norm) ??
    provinceOptions.value.find((p) => normalizeProvinceName(p).includes(norm) || norm.includes(normalizeProvinceName(p))) ??
    null
  )
}

// Fix icon marker mặc định của Leaflet bị vỡ khi build qua bundler (Vite/Webpack):
// đường dẫn ảnh trong CSS gốc của Leaflet không khớp với asset đã qua xử lý.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

// Trung tâm mặc định khi chưa có toạ độ (form mới mở, lat/lng = 0/0):
// Hà Nội, khớp với giá trị mặc định của ô "Khu vực/Tỉnh thành" (form_region).
const DEFAULT_CENTER: L.LatLngTuple = [21.0285, 105.8542]
const DEFAULT_ZOOM = 13

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()

// Nhãn trạng thái dịch trên FE, gộp theo cùng nhóm với STATUS_LABEL_VI cũ
const STATUS_LABEL_KEY: Record<ReliefRequestStatus, string> = {
  Pending: 'requester.status_processing',
  Approved: 'requester.status_processing',
  Assigned: 'requester.status_received',
  InProgress: 'requester.status_received',
  Completed: 'requester.status_completed',
  Cancelled: 'requester.status_cancelled',
}
const statusLabel = (status: ReliefRequestStatus) => t(STATUS_LABEL_KEY[status])

// ── Danh sách yêu cầu ─────────────────────────────────────
const allRequests = ref<ReliefRequestResponse[]>([])
const isLoading = ref(false)
const loadError = ref('')

const loadRequests = async () => {
  isLoading.value = true
  loadError.value = ''
  try { allRequests.value = await getReliefRequests() }
  catch (err) { loadError.value = (err as Error).message || 'Không tải được yêu cầu từ máy chủ.' }
  finally { isLoading.value = false }
}

// Cho phép Dashboard mở thẳng modal tạo/chi tiết qua query (?create=true, ?id=...)
onMounted(async () => {
  await loadRequests()

  if (route.query.create === 'true') {
    openCreateModal()
  }

  const targetId = route.query.id as string | undefined
  if (targetId) {
    const found = allRequests.value.find((r) => r.id === targetId)
    if (found) openDetailModal(found)
  }

  if (route.query.create || route.query.id) {
    const { create, id, ...rest } = route.query
    router.replace({ query: rest })
  }
})

// ── Filter ────────────────────────────────────────────────
// Tab active đổi màu theo đúng nhóm trạng thái:
// đang xử lý = vàng, đã tiếp nhận = xanh dương, hoàn thành = xanh lá
const filterTabs = computed<{ label: string; value: 'all' | RequesterFilterGroup; activeStyle?: Record<string, string> }[]>(() => [
  { label: t('requester.filter_all'), value: 'all', activeStyle: undefined },
  {
    label: t('requester.filter_processing'),
    value: 'processing',
    activeStyle: {
      background: STATUS_GROUP_COLOR.pending.bg,
      borderColor: STATUS_GROUP_COLOR.pending.color,
      color: STATUS_GROUP_COLOR.pending.color,
    },
  },
  {
    label: t('requester.filter_received'),
    value: 'received',
    activeStyle: {
      background: STATUS_GROUP_COLOR.assigned.bg,
      borderColor: STATUS_GROUP_COLOR.assigned.color,
      color: STATUS_GROUP_COLOR.assigned.color,
    },
  },
  {
    label: t('requester.filter_completed'),
    value: 'completed',
    activeStyle: {
      background: STATUS_GROUP_COLOR.completed.bg,
      borderColor: STATUS_GROUP_COLOR.completed.color,
      color: STATUS_GROUP_COLOR.completed.color,
    },
  },
])
const activeFilter = ref<'all' | RequesterFilterGroup>('all')

const filteredRequests = computed(() => {
  if (activeFilter.value === 'all') return allRequests.value
  return allRequests.value.filter((r) => matchesRequesterFilterGroup(r.status, activeFilter.value as RequesterFilterGroup))
})

// ── Modal: Tạo mới ────────────────────────────────────────
const showCreateModal = ref(false)
const isSubmitting = ref(false)
const createError = ref('')

const emptyForm = (): CreateReliefRequestPayload => ({
  title: '',
  description: '',
  address: '',
  region: 'Hà Nội',
  latitude: 0,
  longitude: 0,
  emergencyLevel: 2,
  affectedPeople: 1,
  needFood: false,
  needWater: false,
  needMedicine: false,
  needBlanket: false,
  needShelter: false,
  contactPhone: authStore.user?.phoneNumber || '',
  foodQuantity: null,
  waterQuantity: null,
  medicineQuantity: null,
  blanketQuantity: null,
  shelterQuantity: null,
})

const form = ref<CreateReliefRequestPayload>(emptyForm())

// ── Bản đồ chọn vị trí (Leaflet + OpenStreetMap) ───────────
const mapElRef = ref<HTMLElement | null>(null)
let mapInstance: L.Map | null = null
let markerInstance: L.Marker | null = null
// true trong lúc code tự set toạ độ từ marker → tránh watcher di chuyển
// marker lần nữa (marker đã ở đúng chỗ rồi, chỉ tránh vòng lặp/giật hình).
let isSyncingFromMap = false

const isGeocoding = ref(false)
const suggestedAddressText = ref('')
const suggestedAddressParts = ref<{ line: string; region: string } | null>(null)
let geocodeTimer: ReturnType<typeof setTimeout> | null = null

function initMap() {
  if (!mapElRef.value) return
  destroyMap()

  const hasCoords = form.value.latitude !== 0 || form.value.longitude !== 0
  const start: L.LatLngTuple = hasCoords
    ? [form.value.latitude, form.value.longitude]
    : DEFAULT_CENTER

  const map = L.map(mapElRef.value).setView(start, DEFAULT_ZOOM)
  mapInstance = map

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18,
  }).addTo(map)

  const marker = L.marker(start, { draggable: true }).addTo(map)
  markerInstance = marker

  marker.on('drag', (e) => {
    const pos = (e.target as L.Marker).getLatLng()
    setPosition(pos.lat, pos.lng)
  })

  map.on('click', (e: L.LeafletMouseEvent) => {
    marker.setLatLng(e.latlng)
    setPosition(e.latlng.lat, e.latlng.lng)
  })

  // Luôn sync lat/lng vào form theo vị trí marker để hai ô input không hiện
  // giá trị lạc nhịp (ví dụ marker ở Hà Nội mà input hiện 0 / 0).
  // - hasCoords=true  → toạ độ thật, cho phép reverse geocode bình thường.
  // - hasCoords=false → DEFAULT_CENTER, chỉ sync số, KHÔNG geocode để tránh
  //   tự điền địa chỉ mặc định "72 Đinh Tiên Hoàng" vào form.
  setPosition(start[0], start[1], hasCoords)
}

function destroyMap() {
  if (geocodeTimer) {
    clearTimeout(geocodeTimer)
    geocodeTimer = null
  }
  mapInstance?.remove()
  mapInstance = null
  markerInstance = null
}

// triggerGeocode=false khi init với DEFAULT_CENTER (chưa có toạ độ thật) để
// tránh Nominatim dịch ngược ra địa chỉ mặc định (VD: "72 Đinh Tiên Hoàng").
function setPosition(lat: number, lng: number, triggerGeocode = true) {
  isSyncingFromMap = true
  form.value.latitude = lat
  form.value.longitude = lng
  nextTick(() => { isSyncingFromMap = false })
  if (triggerGeocode) {
    scheduleReverseGeocode(lat, lng)
  }
}

// Gõ tay vào ô Vĩ độ/Kinh độ → di chuyển marker + pan bản đồ theo (2 chiều).
// Cũng là nơi xử lý cho nút "Dùng vị trí hiện tại" (chỉ set form.latitude/
// longitude, watcher này lo phần đồng bộ marker).
watch(
  () => [form.value.latitude, form.value.longitude] as const,
  ([lat, lng]) => {
    if (isSyncingFromMap) return
    if (!mapInstance || !markerInstance) return
    if (typeof lat !== 'number' || typeof lng !== 'number' || Number.isNaN(lat) || Number.isNaN(lng)) return
    markerInstance.setLatLng([lat, lng])
    mapInstance.panTo([lat, lng])
    scheduleReverseGeocode(lat, lng)
  },
)

function scheduleReverseGeocode(lat: number, lng: number) {
  if (geocodeTimer) clearTimeout(geocodeTimer)
  // Nominatim yêu cầu tối đa ~1 request/giây → debounce 700ms sau khi
  // người dùng dừng thao tác (thả ghim/kéo/gõ tay) mới thực sự gọi.
  geocodeTimer = setTimeout(() => {
    reverseGeocode(lat, lng)
  }, 700)
}

async function reverseGeocode(lat: number, lng: number) {
  isGeocoding.value = true
  try {
    // Lưu ý giới hạn Nominatim (chính sách sử dụng công khai của OSM):
    // - Tối đa ~1 request/giây, không polling/loop nhanh (đã debounce ở trên).
    // - Yêu cầu định danh app qua header User-Agent hoặc Referer. Trình duyệt
    //   KHÔNG cho phép JS tự set User-Agent (forbidden header theo Fetch spec),
    //   nên ở đây dựa vào Referer mà trình duyệt tự gửi kèm (là domain của app).
    // - Nếu app lên production quy mô lớn, nên đổi sang dịch vụ geocoding trả
    //   phí (Google/Mapbox/Here...) hoặc tự host Nominatim riêng.
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=vi`
    const res = await fetch(url, { headers: { 'Accept-Language': 'vi' } })
    if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`)
    const data = await res.json()
    const addr = data?.address ?? {}

    const line = [addr.house_number, addr.road || addr.pedestrian || addr.residential, addr.suburb || addr.quarter || addr.village]
      .filter(Boolean)
      .join(', ')
    const region = addr.city || addr.town || addr.state || addr.county || ''

    suggestedAddressText.value = String(data?.display_name ?? line ?? '')
    suggestedAddressParts.value = { line: line || String(data?.display_name ?? ''), region }

    // Ghim tới đâu, tự điền địa chỉ tới đó — ghi đè nội dung cũ vì marker vừa
    // dời sang vị trí mới, nội dung cũ không còn đúng nữa.
    if (suggestedAddressParts.value.line) {
      form.value.address = suggestedAddressParts.value.line
    }
    const matchedProvince = matchProvinceOption(suggestedAddressParts.value.region)
    if (matchedProvince) {
      form.value.region = matchedProvince
    }
  } catch (e) {
    console.error('[MyRequestsView] Reverse geocode failed', e)
    suggestedAddressText.value = ''
    suggestedAddressParts.value = null
  } finally {
    isGeocoding.value = false
  }
}

const currentStep = ref(1)

function goToStep(step: number) {
  if (step > currentStep.value) {
    if (!validateStep(currentStep.value)) return
  }
  currentStep.value = step
  if (step === 2) {
    nextTick(() => {
      initMap()
      if (mapInstance) {
        mapInstance.invalidateSize()
      }
    })
  }
}

function nextStep() {
  if (!validateStep(currentStep.value)) return
  currentStep.value++
  if (currentStep.value === 2) {
    nextTick(() => {
      initMap()
      if (mapInstance) {
        mapInstance.invalidateSize()
      }
    })
  }
}

function validateStep(step: number): boolean {
  createError.value = ''
  if (step === 1) {
    if (!form.value.title.trim()) {
      createError.value = 'Bắt buộc điền tiêu đề yêu cầu hỗ trợ'
      return false
    }
    if (!form.value.affectedPeople || form.value.affectedPeople <= 0) {
      createError.value = 'Bắt buộc điền số người ảnh hưởng hợp lệ'
      return false
    }
    const phoneRegex = /^(0|84)[3|5|7|8|9][0-9]{8}$/
    if (!form.value.contactPhone.trim()) {
      createError.value = 'Bắt buộc điền số điện thoại liên hệ'
      return false
    } else if (!phoneRegex.test(form.value.contactPhone.trim())) {
      createError.value = 'Số điện thoại không hợp lệ! (Ví dụ: 0912345678)'
      return false
    }
    if (!form.value.description.trim()) {
      createError.value = 'Bắt buộc điền mô tả chi tiết hoàn cảnh'
      return false
    }
  } else if (step === 2) {
    if (!form.value.region || !form.value.region.trim()) {
      createError.value = 'Bắt buộc chọn Tỉnh / Thành phố'
      return false
    }
    if (!form.value.address.trim()) {
      createError.value = 'Bắt buộc điền địa chỉ chi tiết (Thôn/Xóm/Số nhà)'
      return false
    }
  }
  return true
}

function onProvinceSelectChange() {
  const coords = resolveProvinceCenter(form.value.region)
  if (coords) {
    form.value.latitude = coords[0]
    form.value.longitude = coords[1]
    if (mapInstance && markerInstance) {
      markerInstance.setLatLng(coords)
      mapInstance.setView(coords, DEFAULT_ZOOM)
    }
  }
}

const openCreateModal = () => {
  currentStep.value = 1
  form.value = emptyForm()
  createError.value = ''
  suggestedAddressText.value = ''
  suggestedAddressParts.value = null
  showCreateModal.value = true
}
const closeCreateModal = () => {
  showCreateModal.value = false
  destroyMap()
}

const useCurrentLocation = () => {
  if (!navigator.geolocation) {
    alert(t('requester.geolocation_unsupported'))
    return
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      form.value.latitude = pos.coords.latitude
      form.value.longitude = pos.coords.longitude
    },
    () => alert(t('requester.geolocation_failed')),
  )
}

onBeforeUnmount(() => {
  destroyMap()
})

const handleCreateSubmit = async () => {
  if (!validateStep(1) || !validateStep(2)) {
    return
  }
  createError.value = ''
  isSubmitting.value = true
  try {
    await createReliefRequest(form.value)
    closeCreateModal()
    await loadRequests()
  } catch (err) {
    createError.value = (err as Error).message || t('requester.create_failed')
  } finally {
    isSubmitting.value = false
  }
}

// ── Modal: Xem chi tiết ───────────────────────────────────
const showDetailModal = ref(false)
const selectedRequest = ref<ReliefRequestResponse | null>(null)

const openDetailModal = (item: ReliefRequestResponse) => {
  selectedRequest.value = item
  cancelError.value = ''
  showDetailModal.value = true
}
const closeDetailModal = () => { showDetailModal.value = false }

const selectedNeeds = computed(() => {
  const r = selectedRequest.value
  if (!r) return []
  const list: string[] = []
  if (r.needFood) list.push(t('requester.need_food'))
  if (r.needWater) list.push(t('requester.need_water'))
  if (r.needMedicine) list.push(t('requester.need_medicine'))
  if (r.needBlanket) list.push(t('requester.need_blanket'))
  if (r.needShelter) list.push(t('requester.need_shelter'))
  return list
})

// ── Hủy yêu cầu ───────────────────────────────────────────
// Theo state machine BE: chủ sở hữu chỉ hủy được khi request chưa
// Completed/Cancelled (Pending/Approved/Assigned/InProgress đều hủy được).
const CANCELABLE_STATUSES: ReliefRequestStatus[] = ['Pending', 'Approved', 'Assigned', 'InProgress']

const canCancel = (item: ReliefRequestResponse | null): boolean => {
  return !!item && CANCELABLE_STATUSES.includes(item.status)
}

const isCancelling = ref(false)
const cancelError = ref('')

const handleCancelRequest = async (item: ReliefRequestResponse) => {
  if (!confirm(t('requester.cancel_confirm', { title: item.title }))) {
    return
  }

  cancelError.value = ''
  isCancelling.value = true
  try {
    await cancelReliefRequest(item.id)
    closeDetailModal()
    await loadRequests()
  } catch (err) {
    cancelError.value = (err as Error).message || t('requester.cancel_failed')
  } finally {
    isCancelling.value = false
  }
}
</script>

<style scoped>
.sos-parser-card {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 20px;
}
.sos-parser-header {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-bottom: 10px;
}
.sos-icon {
  font-size: 20px;
}
.sos-parser-header strong {
  display: block;
  font-size: 15px;
  color: #166534;
}
.sos-parser-header p {
  margin: 2px 0 0;
  font-size: 12px;
  color: #15803d;
}
.sos-textarea {
  width: 100%;
  border: 1px solid #86efac;
  border-radius: 8px;
  padding: 10px;
  font-size: 13px;
  box-sizing: border-box;
  font-family: inherit;
  resize: vertical;
}
.sos-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  align-items: center;
}
.btn-sample {
  background: #dcfce7;
  border: 1px solid #86efac;
  color: #166534;
  font-size: 12px;
  padding: 5px 10px;
  border-radius: 6px;
  cursor: pointer;
}
.btn-sample:hover {
  background: #bbf7d0;
}
.btn-parse {
  background: #16a34a;
  color: white;
  border: none;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  margin-left: auto;
}
.btn-parse:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-parse:hover:not(:disabled) {
  background: #15803d;
}
.sos-summary-alert {
  margin-top: 10px;
  padding: 8px 12px;
  background: #dcfce7;
  color: #166534;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.my-requests-page { max-width: 1000px; margin: 0 auto; }

.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
.page-header h2 { font-size: 24px; font-weight: 800; color: #1a1a2e; letter-spacing: -0.5px; margin: 0 0 4px 0; }
.subtitle { font-size: 13.5px; color: #718096; margin: 0; }

.required { color: #dc2626; font-weight: bold; margin-left: 2px; }
.btn-primary { background-color: #e11d48; color: white; border: none; padding: 12px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.2s ease; }
.btn-primary:hover { background-color: #be123c; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

.filter-bar { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
.filter-tab { background: #fff; border: 1px solid #e2e8f0; color: #475569; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s ease; }
.filter-tab:hover { background: #f8fafc; }
.filter-tab.active { background: #fff1eb; border-color: #ea580c; color: #ea580c; font-weight: 600; }

.card { background: #ffffff; border-radius: 16px; padding: 22px; border: 1px solid #e9ecef; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
.empty-state { text-align: center; padding: 40px 0; color: #94a3b8; font-size: 14px; }

.request-list { display: flex; flex-direction: column; gap: 16px; }
.request-item { display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9; }
.request-item:last-child { border-bottom: none; padding-bottom: 0; }

.req-info { display: flex; align-items: center; gap: 16px; }
.req-icon { background: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center; }
.req-icon svg { width: 20px; height: 20px; color: #64748b; }
.req-info h4 { margin: 0 0 4px 0; font-size: 14px; color: #1e293b; font-weight: 600; }
.req-info .time { font-size: 12px; color: #64748b; }

.req-actions { display: flex; align-items: center; gap: 16px; }
.badge { padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }

.btn-outline { background: transparent; border: 1px solid #e2e8f0; color: #475569; padding: 6px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s ease; }
.btn-outline:hover { background: #fff; border-color: #ea580c; color: #ea580c; }

/* ── Modal ─────────────────────────────────────────────── */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.55);
  display: flex; align-items: center; justify-content: center;
  padding: 20px; z-index: 1000;
}
.modal-box {
  background: #fff; border-radius: 14px; width: 100%; max-width: 560px;
  max-height: 88vh; overflow-y: auto; box-shadow: 0 20px 50px rgba(0,0,0,0.25);
}
.create-modal-box {
  width: 90%;
  max-width: 680px;
  max-height: 90vh;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
}

.modal-subtitle {
  margin: 4px 0 0 0;
  font-size: 12.5px;
  color: #64748b;
  font-weight: 400;
}

/* Wizard Stepper Header */
.wizard-stepper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  position: relative;
  flex: 1;
}

.step-circle {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.step-title {
  font-size: 12.5px;
  font-weight: 600;
  color: #64748b;
  white-space: nowrap;
}

.step-line {
  flex: 1;
  height: 2px;
  background: #e2e8f0;
  margin: 0 10px;
}

.step-item.active .step-circle {
  background: #2563eb;
  color: #fff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
}
.step-item.active .step-title {
  color: #1e293b;
  font-weight: 700;
}

.step-item.completed .step-circle {
  background: #16a34a;
  color: #fff;
}
.step-item.completed .step-title {
  color: #16a34a;
}

.wizard-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.wizard-step-pane {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* Emergency Level Visual Cards */
.emergency-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 4px;
}

.emergency-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fff;
}

.emergency-card:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.emergency-card.selected {
  border-color: #2563eb;
  background: #eff6ff;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.08);
}

.card-icon {
  font-size: 20px;
}

.card-text {
  display: flex;
  flex-direction: column;
}
.card-text strong {
  font-size: 13.5px;
  color: #1e293b;
}
.card-text span {
  font-size: 12px;
  color: #64748b;
  margin-top: 1px;
}

/* Input Suffix & Readonly */
.input-with-suffix {
  position: relative;
  display: flex;
  align-items: center;
}
.input-with-suffix input {
  padding-right: 65px;
}
.input-suffix {
  position: absolute;
  right: 12px;
  font-size: 12.5px;
  color: #64748b;
  font-weight: 500;
  pointer-events: none;
}

.input-readonly {
  background-color: #f1f5f9;
  color: #64748b;
  cursor: not-allowed;
}

.form-select {
  background-color: #fff;
  cursor: pointer;
}

/* Map Header & Layout */
.map-section {
  margin-bottom: 0;
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.btn-geo-compact {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.btn-geo-compact:hover {
  background: #dbeafe;
}

.map-container-wrapper {
  position: relative;
}

.coords-preview {
  margin-top: 12px;
  margin-bottom: 0;
}

/* Needs Visual Grid */
.form-hint {
  font-size: 12.5px;
  color: #64748b;
  margin: -4px 0 12px 0;
}

.needs-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.need-card {
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  transition: all 0.2s ease;
}

.need-card.active {
  border-color: #2563eb;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.08);
}

.need-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  cursor: pointer;
  user-select: none;
}
.need-card-header:hover {
  background: #f8fafc;
}

.need-checkbox input {
  width: 17px;
  height: 17px;
  cursor: pointer;
  accent-color: #2563eb;
}

.need-icon {
  font-size: 22px;
}

.need-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.need-info strong {
  font-size: 13.5px;
  color: #1e293b;
}
.need-info span {
  font-size: 12px;
  color: #64748b;
}

.need-card-body {
  padding: 10px 14px 14px 45px;
  background: #f8fafc;
  border-top: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  gap: 12px;
}
.need-card-body label {
  margin: 0;
  font-size: 12.5px;
  color: #475569;
  white-space: nowrap;
}
.need-card-body .input-with-suffix {
  max-width: 200px;
}

.alert-danger {
  padding: 10px 14px;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  border-radius: 8px;
  color: #e11d48;
}

.wizard-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.btn-submit-final {
  background: linear-gradient(135deg, #16a34a, #15803d);
  border: none;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.btn-submit-final:hover:not(:disabled) {
  background: linear-gradient(135deg, #15803d, #166534);
}

.spinner-icon {
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  100% { transform: rotate(360deg); }
}

@media (max-width: 600px) {
  .wizard-stepper {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .step-line { display: none; }
  .need-card-body {
    flex-direction: column;
    align-items: flex-start;
    padding-left: 14px;
  }
  .need-card-body .input-with-suffix {
    max-width: 100%;
    width: 100%;
  }
}

.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 24px; border-bottom: 1px solid #f1f5f9; position: sticky; top: 0; background: #fff; z-index: 1;
}
.modal-header h3 { margin: 0; font-size: 17px; font-weight: 700; color: #0f172a; }
.modal-close { background: none; border: none; font-size: 18px; cursor: pointer; color: #64748b; }
.modal-close:hover { color: #0f172a; }
.modal-body { padding: 20px 24px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }

.form-group { margin-bottom: 16px; }
.form-row { display: flex; gap: 16px; margin-bottom: 16px; }
.form-row .half { margin-bottom: 0; flex: 1; }
label { display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px; }
.required { color: #e11d48; }
input[type="text"], input[type="number"], input[type="tel"], select, textarea {
  width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 13.5px; box-sizing: border-box;
}
input:focus, select:focus, textarea:focus { outline: none; border-color: #3b82f6; }
textarea { resize: vertical; }
.btn-geo { background: none; border: none; color: #2563eb; font-size: 12.5px; font-weight: 600; cursor: pointer; padding: 0; margin: -8px 0 16px 0; }

.request-map {
  width: 100%;
  height: 340px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  margin-top: 4px;
  z-index: 0;
}
.map-suggestion {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 8px;
  padding: 8px 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 12px;
  color: #475569;
  min-width: 0;
}
.map-suggestion--loading { color: #94a3b8; font-style: italic; }
.map-suggestion--done { color: #15803d; background: #f0fdf4; border-color: #bbf7d0; }
.suggestion-text {
  display: flex;
  align-items: center;
  gap: 5px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}
.suggestion-text svg {
  flex-shrink: 0;
}
.suggestion-text span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.needs-grid { display: flex; flex-direction: column; gap: 10px; }
.need-item { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; cursor: pointer; margin: 0; }
.need-item input { width: 15px; height: 15px; }
.need-quantity-hint { font-size: 11.5px; color: #6b7280; margin: 6px 0 0 0; }
.needs-list { display: flex; flex-wrap: wrap; gap: 10px 16px; margin-top: 8px; }
.need-row { display: flex; align-items: center; gap: 8px; min-width: 220px; }
.need-row .need-item { flex: 0 0 auto; }
.need-qty-input { width: 90px; padding: 5px 8px; font-size: 12.5px; border: 1px solid #d1d5db; border-radius: 6px; }

.error-text { color: #e53e3e; font-size: 12.5px; margin: 8px 0 0 0; }

.detail-header { align-items: flex-start; gap: 16px; }
.detail-header-info { display: flex; flex-direction: column; gap: 8px; }
.detail-header-info .badge { align-self: flex-start; }
.detail-header-info h3 { font-size: 18px; }

.detail-body { display: flex; flex-direction: column; gap: 20px; }

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.detail-field {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: #f8fafc;
  border: 1px solid #eef2f7;
  border-radius: 10px;
  padding: 10px 12px;
}
.detail-field__icon {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e2e8f0;
  color: #ea580c;
  display: flex;
  align-items: center;
  justify-content: center;
}
.detail-field__icon svg { width: 15px; height: 15px; }
.detail-field__label { display: block; font-size: 11.5px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.4px; }
.detail-field__value { display: block; font-size: 13.5px; font-weight: 600; color: #1e293b; margin-top: 2px; word-break: break-word; }

.detail-section { display: flex; flex-direction: column; gap: 8px; }
.detail-section__label { font-size: 11.5px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.4px; }
.detail-section__text { margin: 0; font-size: 13.5px; color: #334155; line-height: 1.6; }

.needs-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.need-chip { background: #fff1eb; color: #ea580c; border: 1px solid #fed7aa; padding: 5px 12px; border-radius: 20px; font-size: 12.5px; font-weight: 600; }
.need-chip--empty { background: #f1f5f9; color: #94a3b8; border-color: #e2e8f0; }

.detail-actions { margin-top: 4px; padding-top: 16px; border-top: 1px solid #f1f5f9; justify-content: flex-start; }
.btn-cancel-request {
  background: transparent;
  border: 1px solid #e11d48;
  color: #e11d48;
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-cancel-request:hover:not(:disabled) { background: #fff1f2; }
.btn-cancel-request:disabled { opacity: 0.6; cursor: not-allowed; }

@media (max-width: 600px) {
  .page-header { flex-direction: column; gap: 14px; }
  .request-item { flex-direction: column; align-items: flex-start; gap: 12px; }
  .req-actions { width: 100%; justify-content: space-between; }
  .form-row { flex-direction: column; gap: 16px; }
  .detail-grid { grid-template-columns: 1fr; }
  .request-map { height: 260px; }
  .map-suggestion { flex-direction: column; align-items: flex-start; }
}
</style>
