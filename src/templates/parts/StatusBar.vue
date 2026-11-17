<script setup lang="ts">
defineProps<{ clock: string; battery: number }>();
</script>

<template>
  <div class="statusbar">
    <div class="left">
      <span class="time">{{ clock }}</span>
    </div>

    <div class="right">
      <svg class="signal" width="13" height="12" viewBox="0 0 13 12">
        <rect x="0" y="7.5" width="2" height="4.5" rx=".8" fill="#17181a" />
        <rect x="3.4" y="5.5" width="2" height="6.5" rx=".8" fill="#17181a" />
        <rect x="6.8" y="3" width="2" height="9" rx=".8" fill="#17181a" />
        <rect x="10.2" y="0.5" width="2" height="11.5" rx=".8" fill="#17181a" />
      </svg>

      <div class="kbs">
        <b>1.00</b>
        <i>KB/s</i>
      </div>

      <div class="net">
        <span>5G</span>
        <svg width="9" height="7" viewBox="0 0 9 7">
          <rect x="0" y="4.4" width="1.7" height="2.6" rx=".6" fill="#17181a" />
          <rect x="2.4" y="3" width="1.7" height="4" rx=".6" fill="#17181a" />
          <rect x="4.8" y="1.6" width="1.7" height="5.4" rx=".6" fill="#17181a" />
          <rect x="7.2" y="0" width="1.7" height="7" rx=".6" fill="#17181a" />
        </svg>
      </div>

      <div class="net">
        <span>4G</span>
        <svg width="9" height="7" viewBox="0 0 9 7">
          <rect x="0" y="4.4" width="1.7" height="2.6" rx=".6" fill="#17181a" />
          <rect x="2.4" y="3" width="1.7" height="4" rx=".6" fill="#17181a" />
          <rect x="4.8" y="1.6" width="1.7" height="5.4" rx=".6" fill="#17181a" />
          <rect x="7.2" y="0" width="1.7" height="7" rx=".6" fill="#17181a" />
        </svg>
      </div>

      <svg class="wifi" width="16" height="12" viewBox="0 0 16 12">
        <path d="M8 11.4 5.9 9a2.9 2.9 0 0 1 4.2 0z" fill="#17181a" />
        <path d="M3.9 6.9a5.9 5.9 0 0 1 8.2 0" fill="none" stroke="#17181a" stroke-width="1.7" stroke-linecap="round" />
        <path d="M1.6 4.3a9.2 9.2 0 0 1 12.8 0" fill="none" stroke="#17181a" stroke-width="1.7" stroke-linecap="round" />
      </svg>

      <div class="battery">
        <span>{{ battery }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.statusbar {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 27px 0 23px;
  color: #17181a;
}

.left {
  display: flex;
  align-items: center;
  gap: 7px;
}

.time {
  font-size: 14.9px;
  font-weight: 600;
  letter-spacing: -0.2px;
}

.badge {
  width: 14px;
  height: 14px;
  border-radius: 4.2px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.badge.purple {
  background: linear-gradient(180deg, #8f7bf0, #6f57e8);
}

.badge.orange {
  background: linear-gradient(180deg, #ffa444, #ff7a1a);
}

.right {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 1px;
}

.kbs {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
  margin-right: 1px;
}

.kbs b {
  font-size: 9px;
  font-weight: 600;
}

.kbs i {
  font-size: 6px;
  font-style: normal;
  letter-spacing: 0.1px;
}

.net {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  line-height: 1;
}

.net span {
  font-size: 7.5px;
  font-weight: 600;
}

.battery {
  width: 25px;
  height: 12px;
  border-radius: 3.5px;
  background: #17181a;
  color: #fff;
  font-size: 7.5px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.battery::after {
  content: '';
  position: absolute;
  right: -2.6px;
  top: 3.4px;
  width: 1.6px;
  height: 5px;
  border-radius: 0 1px 1px 0;
  background: #b9babc;
}
</style>
